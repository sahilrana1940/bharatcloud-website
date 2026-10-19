/**
 * Run `next build` with a larger V8 heap.
 * Next spawns a typecheck worker that inherits NODE_OPTIONS.
 * The default ~2GB cap OOMs this app locally and on Vercel.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const heapFlag = "--max-old-space-size=8192";
const existing = process.env.NODE_OPTIONS ?? "";
const nodeOptions = existing.includes("max-old-space-size")
  ? existing
  : `${existing} ${heapFlag}`.trim();

const child = spawn(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
