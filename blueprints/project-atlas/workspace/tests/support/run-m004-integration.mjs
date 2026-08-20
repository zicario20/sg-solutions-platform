import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const vitestCli = resolve(workspaceRoot, "node_modules/vitest/vitest.mjs");
const testFile = "tests/m004/whatsapp-route.integration.test.ts";
const requestedArguments = process.argv.slice(2);
const watch = requestedArguments.includes("--watch");
const forwardedArguments = requestedArguments.filter(
  (argument) => argument !== "--" && argument !== "--watch",
);
const environment = { ...process.env };

for (const name of Object.keys(environment)) {
  if (
    /(?:DATABASE|POSTGRES|SUPABASE|META|WHATSAPP).*(?:CREDENTIAL|KEY|PASSWORD|SECRET|TOKEN|URL)/u.test(
      name,
    )
  ) {
    delete environment[name];
  }
}

Object.assign(environment, {
  WHATSAPP_ENABLED: "false",
  WHATSAPP_GRAPH_API_VERSION: "",
  WHATSAPP_RUNTIME_STATE: "disabled",
});

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("exit", (code) => resolveExit(code));
  });
}

const vitest = spawn(
  process.execPath,
  [
    vitestCli,
    watch ? "watch" : "run",
    testFile,
    "--pool=threads",
    "--maxWorkers=1",
    ...forwardedArguments,
  ],
  {
    cwd: workspaceRoot,
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  },
);

process.exitCode = (await waitForExit(vitest)) ?? 1;
