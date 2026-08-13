import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = resolve(workspaceRoot, "apps/www");
const staticRoot = resolve(appRoot, "dist/client");
const astroCli = resolve(appRoot, "node_modules/astro/bin/astro.mjs");
const playwrightCli = resolve(workspaceRoot, "node_modules/@playwright/test/cli.js");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("exit", (code) => resolveExit(code));
  });
}

const build = spawn(process.execPath, [astroCli, "build"], {
  cwd: appRoot,
  env: {
    ...process.env,
    PUBLIC_CHAT_STATE: "local",
    PUBLIC_CHAT_ENABLED: "true",
    PUBLIC_CHAT_CANONICAL_ORIGIN: "http://127.0.0.1:4322",
    CHAT_RATE_LIMIT_SECRET: "test-only-rate-limit-secret-32-bytes",
  },
  stdio: "inherit",
  windowsHide: true,
});
if ((await waitForExit(build)) !== 0) throw new Error("M003_FRESH_BUILD_FAILED");
await stat(resolve(staticRoot, "chat/index.html"));

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    const relativeRequest = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    let file = resolve(staticRoot, `.${relativeRequest}`);
    const containment = relative(staticRoot, file);
    if (
      containment === ".." ||
      containment.startsWith(`..${sep}`) ||
      resolve(file) === staticRoot
    ) {
      throw new Error("PATH_OUTSIDE_STATIC_ROOT");
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentTypes.get(extname(file)) ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolveListen, rejectListen) => {
  server.once("error", rejectListen);
  server.listen(4322, "127.0.0.1", resolveListen);
});

let exitCode = 1;
try {
  const playwright = spawn(
    process.execPath,
    [
      playwrightCli,
      "test",
      "tests/e2e/m003-public-chat.spec.ts",
      "--config=playwright.m003.config.ts",
      "--workers=1",
      ...process.argv.slice(2),
    ],
    { cwd: workspaceRoot, env: process.env, stdio: "inherit", windowsHide: true },
  );
  exitCode = (await waitForExit(playwright)) ?? 1;
} finally {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });
}

process.exitCode = exitCode;
