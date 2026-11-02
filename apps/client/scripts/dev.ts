import { watch } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { build, outdir } from "./build";

const { values } = parseArgs({
   args: Bun.argv.slice(2),
   options: { port: { type: "string", default: process.env.PORT || "9000" } }
});

await build("development");

// Rebuild on source changes; refresh the browser to pick them up.
let pending: Timer | undefined;
watch(path.resolve(import.meta.dir, "../src"), { recursive: true }, () => {
   clearTimeout(pending);
   pending = setTimeout(() => build("development").then(() => console.log("rebuilt"), console.error), 100);
});

const rewrites: Record<string, string> = { "/": "/index.html", "/callback": "/callback.html" };

const server = Bun.serve({
   port: Number(values.port),
   async fetch(req) {
      const { pathname } = new URL(req.url);
      const file = Bun.file(path.join(outdir, path.normalize(rewrites[pathname] ?? pathname)));
      if (await file.exists()) return new Response(file);
      return new Response(Bun.file(path.join(outdir, "index.html")), { headers: { "Content-Type": "text/html" } });
   }
});

console.log(`client dev server: ${server.url}`);
