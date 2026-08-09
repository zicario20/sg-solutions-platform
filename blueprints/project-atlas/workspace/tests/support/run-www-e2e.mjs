import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = resolve(workspaceRoot, "apps/www");
const astroCli = resolve(appRoot, "node_modules/astro/bin/astro.mjs");
const playwrightCli = resolve(workspaceRoot, "node_modules/@playwright/test/cli.js");
const healthUrl = "http://127.0.0.1:4321/health/";

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function isPreviewReady(timeout = 1_000) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(timeout) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForPreview(server) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Astro preview exited before becoming ready (exit ${server.exitCode}).`);
    }
    if (await isPreviewReady()) return;
    await delay(250);
  }
  throw new Error("Astro preview did not become ready within 60 seconds.");
}

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("exit", (code) => resolveExit(code));
  });
}

async function stopPreview(server) {
  if (server.exitCode !== null) return;
  const gracefulExit = waitForExit(server);
  server.kill();
  const stoppedGracefully = await Promise.race([
    gracefulExit.then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (stoppedGracefully) return;

  const forcedExit = waitForExit(server);
  server.kill("SIGKILL");
  const stoppedForcibly = await Promise.race([
    forcedExit.then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (!stoppedForcibly) throw new Error("Astro preview could not be stopped.");
}

if (await isPreviewReady(500)) {
  throw new Error(`Port 4321 is already serving ${healthUrl}; stop that process before testing.`);
}

const preview = spawn(
  process.execPath,
  [astroCli, "preview", "--host", "127.0.0.1", "--port", "4321"],
  {
    cwd: appRoot,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "inherit", "inherit"],
    windowsHide: true,
  },
);

let exitCode = 1;
try {
  await waitForPreview(preview);
  const playwright = spawn(
    process.execPath,
    [playwrightCli, "test", "--config=playwright.www.config.ts", ...process.argv.slice(2)],
    {
      cwd: workspaceRoot,
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    },
  );
  exitCode = (await waitForExit(playwright)) ?? 1;
} finally {
  await stopPreview(preview);
}

process.exitCode = exitCode;
