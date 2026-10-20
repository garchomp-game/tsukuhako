import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

export async function startServer(kind) {
  if (process.env.TEST_BASE_URL) return { url: process.env.TEST_BASE_URL, stop: async () => {} };
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const command = kind === "vite" ? ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"] : ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)];
  const child = spawn(process.execPath, command, { cwd: process.cwd(), env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout.on("data", (data) => { logs = (logs + data).slice(-12000); });
  child.stderr.on("data", (data) => { logs = (logs + data).slice(-12000); });
  let childError;
  child.on("error", (error) => { childError = error; });
  const url = `http://127.0.0.1:${port}`;
  async function stop() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const closed = once(child, "exit");
    child.kill("SIGTERM");
    const forced = setTimeout(() => child.kill("SIGKILL"), 5000);
    try { await closed; } finally { clearTimeout(forced); }
  }
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (childError || child.exitCode !== null) { await stop(); throw new Error(`Server failed: ${childError ?? child.exitCode}\n${logs}`); }
    try {
      const response = await fetch(`${url}${kind === "vite" ? "/" : "/api/health"}`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) return { url, stop };
    } catch { /* Startup is not ready yet. */ }
    await delay(200);
  }
  await stop();
  throw new Error(`Server did not become ready within 60 seconds.\n${logs}`);
}
