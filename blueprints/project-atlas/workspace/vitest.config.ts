import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@atlas\/([^/]+)$/,
        replacement: `${root}packages/$1/src/index.ts`,
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: [
      "blueprints/**",
      "superpowers-main/**",
      "ui-ux-pro-max-skill-main/**",
      "cyber-neo-main/**",
      "the-architect-main/**",
      "node_modules/**",
      "tests/e2e/**",
    ],
    setupFiles: ["./tests/setup.ts"],
  },
});
