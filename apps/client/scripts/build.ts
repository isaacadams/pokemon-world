import { rm } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

export type Mode = "development" | "production";

const root = path.resolve(import.meta.dir, "..");
export const outdir = path.join(root, "dist");

// Each page is an HTML entrypoint; Bun bundles its <script> and CSS imports.
const pages = ["index", "game", "callback", "devmode"].map(p => path.join(root, "src", `${p}.html`));

// Bun auto-loads .env, so these also pick up values from apps/client/.env.
function endpoints(mode: Mode) {
   if (mode === "development") {
      return { auth: "http://localhost:3000", websocket: "ws://localhost:8080" };
   }
   return {
      auth: process.env.AUTH_SERVER_URL || "http://localhost:3000",
      websocket: process.env.WEBSOCKET_URL || "ws://localhost:8080"
   };
}

export async function build(mode: Mode) {
   const { auth, websocket } = endpoints(mode);
   await rm(outdir, { recursive: true, force: true });
   const result = await Bun.build({
      entrypoints: pages,
      outdir,
      target: "browser",
      minify: mode === "production",
      sourcemap: mode === "production" ? "none" : "linked",
      loader: { ".tmx": "text" },
      naming: { asset: "assets/[name]-[hash].[ext]" },
      define: {
         "process.env.NODE_ENV": JSON.stringify(mode),
         "process.env.AUTH_SERVER_URL": JSON.stringify(auth),
         "process.env.WEBSOCKET_URL": JSON.stringify(websocket)
      }
   });
   if (!result.success) {
      for (const log of result.logs) console.error(log);
      throw new Error("client build failed");
   }
   return result;
}

if (import.meta.main) {
   const { values } = parseArgs({ args: Bun.argv.slice(2), options: { mode: { type: "string", default: "production" } } });
   const result = await build(values.mode as Mode);
   console.log(`built ${result.outputs.length} files to ${path.relative(process.cwd(), outdir)}`);
}
