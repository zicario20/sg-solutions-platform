# Review package Task 1

## Commits
f56a715 feat(config): add fail-closed WhatsApp runtime config

## Stat
 blueprints/project-atlas/workspace/.env.example    |  10 ++
 .../workspace/packages/config/src/index.ts         |   1 +
 .../workspace/packages/config/src/whatsapp.ts      | 181 +++++++++++++++++++++
 .../tests/contract/production-gate.test.ts         |  24 +++
 .../workspace/tests/m004/whatsapp-config.test.ts   | 120 ++++++++++++++
 blueprints/project-atlas/workspace/turbo.json      |  15 +-
 6 files changed, 350 insertions(+), 1 deletion(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/.env.example b/blueprints/project-atlas/workspace/.env.example
index f68b69c..020a742 100644
--- a/blueprints/project-atlas/workspace/.env.example
+++ b/blueprints/project-atlas/workspace/.env.example
@@ -40,10 +40,20 @@ STRIPE_WEBHOOK_SECRET=
 RESEND_API_KEY=
 EMAIL_FROM=
 GOOGLE_CLIENT_ID=
 GOOGLE_CLIENT_SECRET=
 INNGEST_EVENT_KEY=
 INNGEST_SIGNING_KEY=
 SENTRY_DSN=
 NEXT_PUBLIC_POSTHOG_KEY=
 NEXT_PUBLIC_POSTHOG_HOST=
 OTEL_EXPORTER_OTLP_ENDPOINT=
+# M004 WhatsApp runtime: only disabled/local/staging application behavior is accepted; provider traffic stays disabled.
+WHATSAPP_RUNTIME_STATE=
+WHATSAPP_ENABLED=
+WHATSAPP_PROVIDER=
+WHATSAPP_GRAPH_API_VERSION=
+WHATSAPP_WEBHOOK_MAX_BYTES=
+WHATSAPP_WEBHOOK_READ_TIMEOUT_MILLISECONDS=
+WHATSAPP_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS=
+WHATSAPP_WEBHOOK_CONCURRENCY_LIMIT=
+WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE=
diff --git a/blueprints/project-atlas/workspace/packages/config/src/index.ts b/blueprints/project-atlas/workspace/packages/config/src/index.ts
index 77e52e1..ddf0f0d 100644
--- a/blueprints/project-atlas/workspace/packages/config/src/index.ts
+++ b/blueprints/project-atlas/workspace/packages/config/src/index.ts
@@ -1,3 +1,4 @@
 export const PROJECT_CODE = "project-atlas";
 export const PRODUCT_NAME = "SG Solutions";
 export * from "./public-chat.ts";
+export * from "./whatsapp.ts";
diff --git a/blueprints/project-atlas/workspace/packages/config/src/whatsapp.ts b/blueprints/project-atlas/workspace/packages/config/src/whatsapp.ts
new file mode 100644
index 0000000..fe809e6
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/config/src/whatsapp.ts
@@ -0,0 +1,181 @@
+export type WhatsAppRuntimeState = "disabled" | "local" | "staging";
+
+export type WhatsAppProvider = "meta_cloud";
+
+export type WhatsAppConfig = {
+  enabled: boolean;
+  runtimeState: WhatsAppRuntimeState;
+  provider: WhatsAppProvider;
+  graphApiVersion: string | null;
+  webhookMaxBytes: number;
+  webhookReadTimeoutMilliseconds: number;
+  webhookTotalTimeoutMilliseconds: number;
+  webhookConcurrencyLimit: number;
+  webhookRateLimitPerMinute: number;
+  mediaDownloadEnabled: false;
+  marketingEnabled: false;
+  preliminaryIntakeEnabled: false;
+  providerTrafficAllowed: false;
+};
+
+type WhatsAppEnvironment = Readonly<Record<string, string | undefined>>;
+
+const RUNTIME_STATES = new Set<WhatsAppRuntimeState>(["disabled", "local", "staging"]);
+const GRAPH_API_VERSION_PATTERN = /^v[1-9][0-9]*\.[0-9]+$/;
+
+const DEFAULT_WEBHOOK_MAX_BYTES = 262_144;
+const MINIMUM_WEBHOOK_MAX_BYTES = 1_024;
+const MAXIMUM_WEBHOOK_MAX_BYTES = 1_048_576;
+const DEFAULT_WEBHOOK_READ_TIMEOUT_MILLISECONDS = 5_000;
+const MINIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS = 100;
+const MAXIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS = 10_000;
+const DEFAULT_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS = 10_000;
+const MINIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS = 100;
+const MAXIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS = 30_000;
+const DEFAULT_WEBHOOK_CONCURRENCY_LIMIT = 8;
+const MINIMUM_WEBHOOK_CONCURRENCY_LIMIT = 1;
+const MAXIMUM_WEBHOOK_CONCURRENCY_LIMIT = 32;
+const DEFAULT_WEBHOOK_RATE_LIMIT_PER_MINUTE = 60;
+const MINIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE = 1;
+const MAXIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE = 120;
+
+function readOptional(env: WhatsAppEnvironment, name: string): string | undefined {
+  const value = env[name];
+  return value === "" ? undefined : value;
+}
+
+function readRuntimeState(env: WhatsAppEnvironment): WhatsAppRuntimeState {
+  const value = readOptional(env, "WHATSAPP_RUNTIME_STATE") ?? "disabled";
+
+  if (!RUNTIME_STATES.has(value as WhatsAppRuntimeState)) {
+    throw new Error("WHATSAPP_RUNTIME_STATE must be a supported runtime state");
+  }
+
+  return value as WhatsAppRuntimeState;
+}
+
+function readEnabled(env: WhatsAppEnvironment): boolean {
+  const value = readOptional(env, "WHATSAPP_ENABLED");
+
+  if (value === undefined) {
+    return false;
+  }
+
+  if (value !== "true" && value !== "false") {
+    throw new Error('WHATSAPP_ENABLED must be "true" or "false"');
+  }
+
+  return value === "true";
+}
+
+function readProvider(env: WhatsAppEnvironment): WhatsAppProvider {
+  const value = readOptional(env, "WHATSAPP_PROVIDER") ?? "meta_cloud";
+
+  if (value !== "meta_cloud") {
+    throw new Error("WHATSAPP_PROVIDER must be meta_cloud");
+  }
+
+  return value;
+}
+
+function readGraphApiVersion(
+  env: WhatsAppEnvironment,
+  runtimeState: WhatsAppRuntimeState,
+): string | null {
+  const value = readOptional(env, "WHATSAPP_GRAPH_API_VERSION");
+
+  if (value === undefined) {
+    if (runtimeState === "disabled") {
+      return null;
+    }
+
+    throw new Error("WHATSAPP_GRAPH_API_VERSION is required unless disabled");
+  }
+
+  if (!GRAPH_API_VERSION_PATTERN.test(value)) {
+    throw new Error("WHATSAPP_GRAPH_API_VERSION must be an explicit Graph API version");
+  }
+
+  return value;
+}
+
+function readBoundedInteger(
+  env: WhatsAppEnvironment,
+  name: string,
+  fallback: number,
+  minimum: number,
+  maximum: number,
+): number {
+  const value = readOptional(env, name);
+
+  if (value === undefined) {
+    return fallback;
+  }
+
+  if (!/^\d+$/.test(value)) {
+    throw new Error(`${name} must be an integer`);
+  }
+
+  const parsed = Number(value);
+
+  if (parsed < minimum) {
+    throw new Error(`${name} must be at least ${minimum}`);
+  }
+
+  if (parsed > maximum) {
+    throw new Error(`${name} must be at most ${maximum}`);
+  }
+
+  return parsed;
+}
+
+export function readWhatsAppConfig(env: WhatsAppEnvironment): WhatsAppConfig {
+  const runtimeState = readRuntimeState(env);
+  const requestedEnabled = readEnabled(env);
+
+  return {
+    enabled: requestedEnabled && (runtimeState === "local" || runtimeState === "staging"),
+    runtimeState,
+    provider: readProvider(env),
+    graphApiVersion: readGraphApiVersion(env, runtimeState),
+    webhookMaxBytes: readBoundedInteger(
+      env,
+      "WHATSAPP_WEBHOOK_MAX_BYTES",
+      DEFAULT_WEBHOOK_MAX_BYTES,
+      MINIMUM_WEBHOOK_MAX_BYTES,
+      MAXIMUM_WEBHOOK_MAX_BYTES,
+    ),
+    webhookReadTimeoutMilliseconds: readBoundedInteger(
+      env,
+      "WHATSAPP_WEBHOOK_READ_TIMEOUT_MILLISECONDS",
+      DEFAULT_WEBHOOK_READ_TIMEOUT_MILLISECONDS,
+      MINIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS,
+      MAXIMUM_WEBHOOK_READ_TIMEOUT_MILLISECONDS,
+    ),
+    webhookTotalTimeoutMilliseconds: readBoundedInteger(
+      env,
+      "WHATSAPP_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS",
+      DEFAULT_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS,
+      MINIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS,
+      MAXIMUM_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS,
+    ),
+    webhookConcurrencyLimit: readBoundedInteger(
+      env,
+      "WHATSAPP_WEBHOOK_CONCURRENCY_LIMIT",
+      DEFAULT_WEBHOOK_CONCURRENCY_LIMIT,
+      MINIMUM_WEBHOOK_CONCURRENCY_LIMIT,
+      MAXIMUM_WEBHOOK_CONCURRENCY_LIMIT,
+    ),
+    webhookRateLimitPerMinute: readBoundedInteger(
+      env,
+      "WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE",
+      DEFAULT_WEBHOOK_RATE_LIMIT_PER_MINUTE,
+      MINIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE,
+      MAXIMUM_WEBHOOK_RATE_LIMIT_PER_MINUTE,
+    ),
+    mediaDownloadEnabled: false,
+    marketingEnabled: false,
+    preliminaryIntakeEnabled: false,
+    providerTrafficAllowed: false,
+  };
+}
diff --git a/blueprints/project-atlas/workspace/tests/contract/production-gate.test.ts b/blueprints/project-atlas/workspace/tests/contract/production-gate.test.ts
index 01220c3..95b35f3 100644
--- a/blueprints/project-atlas/workspace/tests/contract/production-gate.test.ts
+++ b/blueprints/project-atlas/workspace/tests/contract/production-gate.test.ts
@@ -1,11 +1,12 @@
 import { existsSync, readFileSync } from "node:fs";
+import { readWhatsAppConfig } from "@atlas/config";
 import { describe, expect, it } from "vitest";
 
 const releaseFiles = [
   ".github/workflows/ci.yml",
   "apps/www/vercel.json",
   "apps/app/vercel.json",
   "docs/phases/PCR-001-production-foundation.md",
   "PROJECT_STATE.md",
 ];
 
@@ -25,11 +26,34 @@ describe.skipIf(!releaseGate)("production gate artifacts", () => {
   });
 
   it("requires executable CI gates and rollback evidence", () => {
     const ci = readFileSync(".github/workflows/ci.yml", "utf8");
     const pcr = readFileSync("docs/phases/PCR-001-production-foundation.md", "utf8");
     expect(ci).toMatch(/corepack pnpm lint/);
     expect(ci).toMatch(/corepack pnpm exec playwright test tests\/e2e\/health\.spec\.ts/);
     expect(pcr).toMatch(/Rollback/);
     expect(pcr).toMatch(/Verification evidence/);
   });
+
+  it("keeps provider traffic disabled for every current release configuration", () => {
+    const currentReleaseConfigurations = [
+      {},
+      {
+        WHATSAPP_RUNTIME_STATE: "local",
+        WHATSAPP_ENABLED: "true",
+        WHATSAPP_GRAPH_API_VERSION: "v23.0",
+        WHATSAPP_PROVIDER_TRAFFIC_ALLOWED: "true",
+        WHATSAPP_OPERATIONAL_APPROVAL: "true",
+      },
+      {
+        WHATSAPP_RUNTIME_STATE: "staging",
+        WHATSAPP_ENABLED: "true",
+        WHATSAPP_GRAPH_API_VERSION: "v23.0",
+        WHATSAPP_PROVIDER_TRAFFIC_ALLOWED: "true",
+      },
+    ];
+
+    for (const environment of currentReleaseConfigurations) {
+      expect(readWhatsAppConfig(environment).providerTrafficAllowed).toBe(false);
+    }
+  });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-config.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-config.test.ts
new file mode 100644
index 0000000..bb50e4d
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-config.test.ts
@@ -0,0 +1,120 @@
+import { readWhatsAppConfig } from "@atlas/config";
+import { describe, expect, it } from "vitest";
+
+describe("readWhatsAppConfig", () => {
+  it("uses disabled, provider-disabled defaults", () => {
+    expect(readWhatsAppConfig({})).toEqual({
+      enabled: false,
+      runtimeState: "disabled",
+      provider: "meta_cloud",
+      graphApiVersion: null,
+      webhookMaxBytes: 262_144,
+      webhookReadTimeoutMilliseconds: 5_000,
+      webhookTotalTimeoutMilliseconds: 10_000,
+      webhookConcurrencyLimit: 8,
+      webhookRateLimitPerMinute: 60,
+      mediaDownloadEnabled: false,
+      marketingEnabled: false,
+      preliminaryIntakeEnabled: false,
+      providerTrafficAllowed: false,
+    });
+  });
+
+  it.each(["local", "staging"] as const)(
+    "enables only %s application behavior with an explicit Graph API version",
+    (runtimeState) => {
+      const config = readWhatsAppConfig({
+        WHATSAPP_RUNTIME_STATE: runtimeState,
+        WHATSAPP_ENABLED: "true",
+        WHATSAPP_GRAPH_API_VERSION: "v23.0",
+      });
+
+      expect(config.enabled).toBe(true);
+      expect(config.runtimeState).toBe(runtimeState);
+      expect(config.graphApiVersion).toBe("v23.0");
+      expect(config.providerTrafficAllowed).toBe(false);
+    },
+  );
+
+  it("does not enable disabled behavior when requested", () => {
+    expect(readWhatsAppConfig({ WHATSAPP_ENABLED: "true" }).enabled).toBe(false);
+  });
+
+  it("rejects malformed enabled flags", () => {
+    expect(() => readWhatsAppConfig({ WHATSAPP_ENABLED: "yes" })).toThrow(
+      'WHATSAPP_ENABLED must be "true" or "false"',
+    );
+  });
+
+  it.each(["activation_ready", "operational"])(
+    "rejects unapproved %s runtime states",
+    (runtimeState) => {
+      expect(() => readWhatsAppConfig({ WHATSAPP_RUNTIME_STATE: runtimeState })).toThrow(
+        "WHATSAPP_RUNTIME_STATE must be a supported runtime state",
+      );
+    },
+  );
+
+  it("accepts only the Meta Cloud provider, never a test adapter", () => {
+    expect(() => readWhatsAppConfig({ WHATSAPP_PROVIDER: "test" })).toThrow(
+      "WHATSAPP_PROVIDER must be meta_cloud",
+    );
+    expect(() => readWhatsAppConfig({ WHATSAPP_PROVIDER: "other_provider" })).toThrow(
+      "WHATSAPP_PROVIDER must be meta_cloud",
+    );
+  });
+
+  it("requires an explicit valid Graph API version outside disabled behavior", () => {
+    expect(() => readWhatsAppConfig({ WHATSAPP_RUNTIME_STATE: "local" })).toThrow(
+      "WHATSAPP_GRAPH_API_VERSION is required unless disabled",
+    );
+
+    for (const version of ["v0.1", "v23", "23.0", "v23.0.1"]) {
+      expect(() =>
+        readWhatsAppConfig({
+          WHATSAPP_RUNTIME_STATE: "staging",
+          WHATSAPP_GRAPH_API_VERSION: version,
+        }),
+      ).toThrow("WHATSAPP_GRAPH_API_VERSION must be an explicit Graph API version");
+    }
+  });
+
+  it.each([
+    ["WHATSAPP_WEBHOOK_MAX_BYTES", 1_024, 1_048_576],
+    ["WHATSAPP_WEBHOOK_READ_TIMEOUT_MILLISECONDS", 100, 10_000],
+    ["WHATSAPP_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS", 100, 30_000],
+    ["WHATSAPP_WEBHOOK_CONCURRENCY_LIMIT", 1, 32],
+    ["WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE", 1, 120],
+  ] as const)("enforces bounds for %s", (name, minimum, maximum) => {
+    expect(readWhatsAppConfig({ [name]: String(minimum) })).toBeDefined();
+    expect(readWhatsAppConfig({ [name]: String(maximum) })).toBeDefined();
+    expect(() => readWhatsAppConfig({ [name]: "0" })).toThrow(
+      `${name} must be at least ${minimum}`,
+    );
+    expect(() => readWhatsAppConfig({ [name]: String(maximum + 1) })).toThrow(
+      `${name} must be at most ${maximum}`,
+    );
+    expect(() => readWhatsAppConfig({ [name]: "1.5" })).toThrow(`${name} must be an integer`);
+  });
+
+  it("keeps provider traffic and irreversible gates disabled despite activation-looking input", () => {
+    expect(
+      readWhatsAppConfig({
+        WHATSAPP_RUNTIME_STATE: "staging",
+        WHATSAPP_ENABLED: "true",
+        WHATSAPP_GRAPH_API_VERSION: "v23.0",
+        WHATSAPP_PROVIDER_TRAFFIC_ALLOWED: "true",
+        WHATSAPP_MEDIA_DOWNLOAD_ENABLED: "true",
+        WHATSAPP_MARKETING_ENABLED: "true",
+        WHATSAPP_PRELIMINARY_INTAKE_ENABLED: "true",
+        WHATSAPP_OPERATIONAL_APPROVAL: "true",
+      }),
+    ).toMatchObject({
+      enabled: true,
+      mediaDownloadEnabled: false,
+      marketingEnabled: false,
+      preliminaryIntakeEnabled: false,
+      providerTrafficAllowed: false,
+    });
+  });
+});
diff --git a/blueprints/project-atlas/workspace/turbo.json b/blueprints/project-atlas/workspace/turbo.json
index 9f82ca2..bf5b01a 100644
--- a/blueprints/project-atlas/workspace/turbo.json
+++ b/blueprints/project-atlas/workspace/turbo.json
@@ -1,13 +1,26 @@
 {
   "$schema": "https://turbo.build/schema.json",
-  "globalEnv": ["M003_POSTGRES_INTEGRATION_URL", "PLAYWRIGHT_BASE_URL", "RELEASE_GATE"],
+  "globalEnv": [
+    "M003_POSTGRES_INTEGRATION_URL",
+    "PLAYWRIGHT_BASE_URL",
+    "RELEASE_GATE",
+    "WHATSAPP_RUNTIME_STATE",
+    "WHATSAPP_ENABLED",
+    "WHATSAPP_PROVIDER",
+    "WHATSAPP_GRAPH_API_VERSION",
+    "WHATSAPP_WEBHOOK_MAX_BYTES",
+    "WHATSAPP_WEBHOOK_READ_TIMEOUT_MILLISECONDS",
+    "WHATSAPP_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS",
+    "WHATSAPP_WEBHOOK_CONCURRENCY_LIMIT",
+    "WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE"
+  ],
   "tasks": {
     "build": {
       "dependsOn": ["^build"],
       "inputs": [
         "$TURBO_DEFAULT$",
         "!blueprints/**",
         "!superpowers-main/**",
         "!ui-ux-pro-max-skill-main/**",
         "!cyber-neo-main/**",
         "!the-architect-main/**"
```
