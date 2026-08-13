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
  [".webmanifest", "application/manifest+json"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
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
    ASTRO_TELEMETRY_DISABLED: "1",
    PUBLIC_CHAT_ENABLED: "false",
    PUBLIC_CHAT_STATE: "disabled",
  },
  stdio: "inherit",
  windowsHide: true,
});
if ((await waitForExit(build)) !== 0) throw new Error("WWW_FRESH_BUILD_FAILED");
await stat(resolve(staticRoot, "index.html"));

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    const redirects = new Map([
      ["/preguntas-frecuentes/", "/recursos/preguntas-frecuentes/"],
      ["/en/faq/", "/en/resources/faq/"],
    ]);
    const redirect = redirects.get(pathname);
    if (redirect) {
      response.writeHead(308, { location: redirect });
      response.end();
      return;
    }
    const relativeRequest =
      pathname === "/health/"
        ? "/health"
        : pathname.endsWith("/")
          ? `${pathname}index.html`
          : pathname;
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
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    const notFoundFile = resolve(
      staticRoot,
      pathname === "/en" || pathname.startsWith("/en/") ? "en/404/index.html" : "404.html",
    );
    const body = await readFile(notFoundFile);
    response.writeHead(404, {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    });
    response.end(body);
  }
});

await new Promise((resolveListen, rejectListen) => {
  server.once("error", rejectListen);
  server.listen(4321, "127.0.0.1", resolveListen);
});

let exitCode = 1;
try {
  const playwright = spawn(
    process.execPath,
    [playwrightCli, "test", "--config=playwright.www.config.ts", ...process.argv.slice(2)],
    { cwd: workspaceRoot, env: process.env, stdio: "inherit", windowsHide: true },
  );
  exitCode = (await waitForExit(playwright)) ?? 1;
} finally {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });
}

process.exitCode = exitCode;
