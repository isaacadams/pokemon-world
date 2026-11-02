const config = {
   port: Number(process.env.PORT || process.env.port || 8080),
   // Comma-separated browser origins allowed to connect; unset allows any (local dev).
   allowedOrigins: String(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map(o => o.trim())
      .filter(Boolean),
   maxClients: Number(process.env.WS_MAX_CLIENTS || 200),
   maxPayloadBytes: Number(process.env.WS_MAX_PAYLOAD_BYTES || 4096),
   // Per-connection message budget; the client sends one update per frame while moving.
   maxMessagesPerSecond: Number(process.env.WS_MAX_MESSAGES_PER_SECOND || 200)
};

const WebSocket = require("ws");
const server = new WebSocket.Server({
   port: config.port,
   maxPayload: config.maxPayloadBytes,
   verifyClient: ({ origin }) => config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)
});

// Heartbeat/idle-timeout: terminate unresponsive clients to avoid ghost players
// Modes:
//  - Default (ping): use WS ping/pong to detect liveness
//  - Message (env WS_HEARTBEAT_MODE=message): treat client liveness as any message activity
function markAlive() {
   this.isAlive = true;
}

/***
 * TODO:
 *
 * - if websocket is idle, then broadcast "idle" signal so screens can indicate idle players
 * - if websocket is idle for too long, then terminate and broadcast the removal of the player
 */

class PlayerState {
   id;
   // Spawn players at world center to be visible to others immediately
   position = { x: 480, y: 320 };
   name = "Player";
   ws;

   constructor(id, ws) {
      this.id = id;
      this.ws = ws;
   }
}

class PlayerStateManager {
   map = new Map();
   constructor() {}

   add(ws) {
      const player = new PlayerState(generateUniqueId(), ws);
      this.map.set(player.id, player);
      return player;
   }

   players() {
      return Object.fromEntries(
         [...this.map.values()].map(player => [player.id, { id: player.id, position: player.position, name: player.name }])
      );
   }
}

const manager = new PlayerStateManager();

server.on("connection", ws => {
   if (server.clients.size > config.maxClients) {
      ws.close(1013, "server full");
      return;
   }

   // Initialize heartbeat state and pong handler
   ws.isAlive = true;
   ws.on("pong", markAlive);
   ws.lastActivityMs = Date.now();

   const player = manager.add(ws);

   console.log(`Player ${player.id} connected`);

   // Send player their ID
   ws.send(JSON.stringify({ type: "init", id: player.id }));

   // Broadcast current players to the new player
   // send all player data
   ws.send(
      JSON.stringify({
         type: "players",
         players: manager.players()
      })
   );

   // Notify all players of the new connection (name may be updated later via "hello")
   broadcast({ type: "join", id: player.id, x: player.position.x, y: player.position.y, name: player.name });

   let windowStartMs = Date.now();
   let windowCount = 0;

   ws.on("message", message => {
      // Any message counts as activity
      ws.isAlive = true;
      ws.lastActivityMs = Date.now();

      if (ws.lastActivityMs - windowStartMs >= 1000) {
         windowStartMs = ws.lastActivityMs;
         windowCount = 0;
      }
      if (++windowCount > config.maxMessagesPerSecond) return;

      const data = parseMessage(message);
      if (!data) return;
      if (data.type === "update") {
         if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
         // Update player position
         player.position.x = data.x;
         player.position.y = data.y;

         // Broadcast to all other players; the id is the sender's, never client-supplied
         broadcast({ type: "update", id: player.id, x: data.x, y: data.y }, ws);
      } else if (data.type === "hello") {
         // Client provides display name after connection
         if (typeof data.name === "string" && data.name.trim().length > 0) {
            player.name = data.name.trim().slice(0, 40);
            // Inform all clients of this player's name
            broadcast({ type: "rename", id: player.id, name: player.name });
         }
      }
   });

   ws.on("close", () => {
      manager.map.delete(player.id);
      broadcast({ type: "leave", id: player.id });
      console.log(`Player ${player.id} disconnected`);
   });

   ws.on("error", err => {
      console.error(`WebSocket error for player ${player.id}:`, err?.message || err);
   });
});

function broadcast(message, excludeWs = null) {
   server.clients.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
         client.send(JSON.stringify(message));
      }
   });
}

// Returns the parsed message object, or null for malformed input.
function parseMessage(message) {
   try {
      const data = JSON.parse(message);
      return data && typeof data === "object" ? data : null;
   } catch {
      return null;
   }
}

function generateUniqueId() {
   return Math.random().toString(36).substring(2, 9);
}

console.log(`WebSocket server running on ws://localhost:${config.port}`);

// Periodically ping clients; terminate those that fail to respond
const HEARTBEAT_INTERVAL_MS = Number(process.env.WS_HEARTBEAT_INTERVAL_MS || 30000);
const IDLE_TIMEOUT_MS = Number(process.env.WS_IDLE_TIMEOUT_MS || 60000);
const HEARTBEAT_MODE = String(process.env.WS_HEARTBEAT_MODE || "ping");
const heartbeatInterval = setInterval(() => {
   server.clients.forEach(ws => {
      if (ws.readyState !== WebSocket.OPEN) return;
      if (HEARTBEAT_MODE === "message") {
         const last = ws.lastActivityMs || 0;
         if (Date.now() - last > IDLE_TIMEOUT_MS) {
            try {
               ws.terminate();
            } catch {}
         }
         return;
      }

      if (ws.isAlive === false) {
         // Unresponsive; terminate. 'close' handler will clean up player and broadcast.
         try {
            ws.terminate();
         } catch {}
         return;
      }
      ws.isAlive = false;
      try {
         ws.ping();
      } catch {}
   });
}, HEARTBEAT_INTERVAL_MS);

server.on("close", () => {
   clearInterval(heartbeatInterval);
});
