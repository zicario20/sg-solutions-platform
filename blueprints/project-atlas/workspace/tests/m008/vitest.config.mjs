import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dependencyRoot = process.env.ATLAS_M008_DEPENDENCY_ROOT
  ? `${process.env.ATLAS_M008_DEPENDENCY_ROOT.replace(/[\\/]?$/u, "/")}`
  : root;

export default {
  root,
  resolve: {
    alias: [
      {
        find: /^react$/,
        replacement: `${dependencyRoot}apps/app/node_modules/react/index.js`,
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: `${dependencyRoot}apps/app/node_modules/react/jsx-runtime.js`,
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: `${dependencyRoot}apps/app/node_modules/react/jsx-dev-runtime.js`,
      },
      {
        find: /^react-dom\/server$/,
        replacement: `${dependencyRoot}apps/app/node_modules/react-dom/server.node.js`,
      },
      {
        find: /^@atlas\/([^/]+)$/,
        replacement: `${root}packages/$1/src/index.ts`,
      },
    ],
  },
  test: {
    environment: "node",
    setupFiles: [`${root}tests/setup.ts`],
  },
};
