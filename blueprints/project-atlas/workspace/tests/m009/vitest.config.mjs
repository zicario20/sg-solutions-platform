import { existsSync } from "node:fs";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "../..");
const dependencyRoot = process.env.ATLAS_M009_DEPENDENCY_ROOT ?? workspaceRoot;
const reactRoot = existsSync(resolve(dependencyRoot, "apps/app/node_modules/react"))
  ? resolve(dependencyRoot, "apps/app/node_modules")
  : resolve(dependencyRoot, "node_modules");

export default {
  root: workspaceRoot,
  resolve: {
    alias: [
      { find: /^@atlas\/(.+)$/, replacement: `${workspaceRoot}/packages/$1/src/index.ts` },
      { find: "react/jsx-runtime", replacement: resolve(reactRoot, "react/jsx-runtime.js") },
      { find: "react/jsx-dev-runtime", replacement: resolve(reactRoot, "react/jsx-dev-runtime.js") },
      { find: "react-dom/server", replacement: resolve(reactRoot, "react-dom/server.node.js") },
      { find: "react", replacement: resolve(reactRoot, "react/index.js") }
    ]
  },
  test: {
    environment: "node",
    include: ["tests/m009/**/*.test.ts", "tests/m009/**/*.test.tsx"]
  }
};
