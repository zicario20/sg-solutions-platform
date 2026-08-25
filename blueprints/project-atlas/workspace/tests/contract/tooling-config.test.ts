import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type BiomeConfig = {
  files?: { includes?: string[] };
  linter?: { rules?: { preset?: string; recommended?: boolean } };
};

type TurboConfig = {
  globalEnv?: string[];
};

type WorkspacePackage = {
  scripts?: Record<string, string>;
};

type TypeScriptConfig = {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
};

describe("tooling configuration", () => {
  it("uses the current Biome preset and folder-ignore syntax", () => {
    const config = JSON.parse(readFileSync("biome.json", "utf8")) as BiomeConfig;

    expect(config.linter?.rules?.preset).toBe("recommended");
    expect(config.linter?.rules?.recommended).toBeUndefined();
    expect(config.files?.includes?.filter((pattern) => pattern.startsWith("!!"))).not.toContain(
      expect.stringMatching(/\/\*\*$/),
    );
    expect(config.files?.includes).toEqual(
      expect.arrayContaining(["!!**/.turbo", "!!**/.next", "!!**/.astro", "!!**/node_modules"]),
    );
  });

  it("declares environment variables that affect validation behavior", () => {
    const config = JSON.parse(readFileSync("turbo.json", "utf8")) as TurboConfig;

    expect(config.globalEnv).toEqual(
      expect.arrayContaining(["PLAYWRIGHT_BASE_URL", "RELEASE_GATE"]),
    );
  });

  it("keeps a package-local project for each workspace and validates declared TypeScript scripts", () => {
    const packageDirectories = readdirSync("packages", { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const directory of packageDirectories) {
      const packageRoot = `packages/${directory}`;
      const packageJson = JSON.parse(readFileSync(`${packageRoot}/package.json`, "utf8")) as {
        scripts?: Record<string, string>;
      };

      expect(existsSync(`${packageRoot}/tsconfig.json`), `${directory} must own a tsconfig`).toBe(
        true,
      );
      const validTypeScriptCommand = /^(tsc --noEmit|tsc -p tsconfig\.json --noEmit)$/;

      if (packageJson.scripts?.typecheck) {
        expect(packageJson.scripts.typecheck).toMatch(validTypeScriptCommand);
      }

      if (packageJson.scripts?.build) {
        expect(packageJson.scripts.build).toMatch(validTypeScriptCommand);
      }
    }
  });

  it("uses TypeScript 6 path aliases without the deprecated baseUrl option", () => {
    const rootConfig = JSON.parse(readFileSync("tsconfig.json", "utf8")) as TypeScriptConfig;
    const publicAppConfig = JSON.parse(
      readFileSync("apps/www/tsconfig.json", "utf8"),
    ) as TypeScriptConfig;

    expect(rootConfig.compilerOptions?.baseUrl).toBeUndefined();
    expect(rootConfig.compilerOptions?.paths?.["@atlas/*"]).toEqual(["./packages/*/src/index.ts"]);
    expect(publicAppConfig.compilerOptions?.baseUrl).toBeUndefined();
    expect(publicAppConfig.compilerOptions?.paths?.["@atlas/*"]).toEqual([
      "../../packages/*/src/index.ts",
    ]);
  });

  it("keeps framework declarations and limits authorized routes to the public site", () => {
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(existsSync("apps/app/next-env.d.ts")).toBe(true);
    expect(existsSync("apps/www/src/env.d.ts")).toBe(true);
    expect(gitignore).not.toMatch(/^next-env\.d\.ts$/m);
    expect(existsSync("apps/app/app")).toBe(false);
    expect(existsSync("apps/app/pages")).toBe(false);
    expect(existsSync("apps/www/src/pages")).toBe(true);
  });

  it("provides a Phase 0 scaffold validation command", () => {
    const workspacePackage = JSON.parse(readFileSync("package.json", "utf8")) as WorkspacePackage;

    expect(workspacePackage.scripts?.["scaffold:validate"]).toBe(
      "corepack pnpm lint && corepack pnpm format:check && corepack pnpm typecheck && corepack pnpm test && corepack pnpm contract:imports",
    );
  });

  it("pins audited transitive packages above known vulnerable versions", () => {
    const pnpmWorkspace = readFileSync("pnpm-workspace.yaml", "utf8").replace(/\r\n/g, "\n");

    expect(pnpmWorkspace).toContain("overrides:\n");
    expect(pnpmWorkspace).toContain("  esbuild: 0.25.12\n");
    expect(pnpmWorkspace).toContain("  postcss: 8.5.25\n");
    expect(pnpmWorkspace).toContain("  sharp: 0.35.3\n");
  });

  it("does not embed database credentials in tracked test configuration", () => {
    const setup = readFileSync("tests/setup.ts", "utf8");
    const environmentExample = readFileSync(".env.example", "utf8");
    const compose = readFileSync("docker-compose.yml", "utf8");

    expect(setup).not.toContain("postgresql://");
    expect(environmentExample).not.toContain("postgresql://");
    expect(compose).toContain("ATLAS_POSTGRES_PASSWORD");
    expect(compose).not.toContain("POSTGRES_PASSWORD: atlas");
  });

  it("binds the local development database to loopback only", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");
    const portExpression = "${" + "ATLAS_POSTGRES_PORT:-55432}";

    expect(compose).toContain(`127.0.0.1:${portExpression}:5432`);
    expect(compose).not.toContain(`- "${portExpression}:5432"`);
  });
});
