const { spawn } = require("child_process");
const WebSocket = require("ws");

function waitForMessage(ws, predicate, timeoutMs = 2000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("timeout waiting for message")), timeoutMs);
		ws.on("message", data => {
			try {
				const msg = JSON.parse(String(data));
				if (predicate(msg)) {
					clearTimeout(timer);
					resolve(msg);
				}
			} catch (e) {}
		});
	});
}

function delay(ms) {
	return new Promise(r => setTimeout(r, ms));
}

// Pick a test port unlikely to be in use
const PORT = 19081;
const SERVER_URL = `ws://localhost:${PORT}`;

describe("server idle timeout (message mode)", () => {
	let serverProc;

	beforeAll(async () => {
		serverProc = spawn("node", ["apps/server/server.js"], {
			cwd: process.cwd(),
			env: {
				...process.env,
				PORT: String(PORT),
				WS_HEARTBEAT_MODE: "message",
				WS_HEARTBEAT_INTERVAL_MS: "50",
				WS_IDLE_TIMEOUT_MS: "150"
			},
			stdio: ["ignore", "pipe", "pipe"]
		});
		// Wait briefly for server to start
		await delay(150);
	});

	afterAll(() => {
		try {
			serverProc?.kill();
		} catch {}
	});

	it("removes idle client and broadcasts leave", async () => {
		const ws1 = new WebSocket(SERVER_URL);
		const ws2 = new WebSocket(SERVER_URL);

		// Wait for init on both
		const init1P = waitForMessage(ws1, m => m.type === "init");
		const init2P = waitForMessage(ws2, m => m.type === "init");
		const [{ id: id1 }, { id: id2 }] = await Promise.all([init1P, init2P]);
		expect(id1).toBeDefined();
		expect(id2).toBeDefined();

		// Ensure both are visible to each other
		// ws2 should eventually hear about ws1 via players/join messages
		// But for the assertion we only need to observe the leave for ws1

		// Now do nothing from ws1 (idle). Wait for ws2 to receive leave for ws1.
		const leaveMsg = await waitForMessage(ws2, m => m.type === "leave" && m.id === id1, 5000);
		expect(leaveMsg).toEqual({ type: "leave", id: id1 });

		// Cleanup
		ws1.close();
		ws2.close();
	});
});
