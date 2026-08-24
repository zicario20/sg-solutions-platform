import { createConfiguredAuthControlPlane } from "../../apps/app/src/lib/auth/http.ts";
import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import type { AuthSql, AuthTransactionSql } from "@atlas/database";
import { describe, expect, it } from "vitest";

class FakeHandlerSql implements AuthSql {
  readonly parameters: unknown[][] = [];
  async begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> {
    return callback({ unsafe: async <R>(statement: string, parameters: readonly unknown[] = []) => {
      this.parameters.push([...parameters]);
      if (statement.includes("atlas_auth_admit_and_enqueue")) return [{ allowed: true }] as R;
      if (statement.includes("atlas_auth_append_audit")) return [{ appended: true }] as R;
      return [] as R;
    } });
  }
}

describe("AR-007 auth handler durable control wiring", () => {
  it("hashes action, IP, account, email, phone, and device risk identifiers before one durable admission", async () => {
    const sql = new FakeHandlerSql();
    const controlPlane = createConfiguredAuthControlPlane({
      DATABASE_URL: "postgres://configured",
      AUTH_CANONICAL_ORIGIN: "https://portal.example",
      AUTH_CONTROL_HMAC_KEY: "a-secure-test-hmac-key",
      AUTH_EMAIL_PROVIDER_ENABLED: "true",
    }, { sql });
    if (!controlPlane) throw new Error("expected configured control plane");
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", trustProxyHeaders: true, controlPlane });

    const response = await runtime.handle("recovery", new Request("https://portal.example/api/auth/recovery", {
      method: "POST",
      headers: { origin: "https://portal.example", "x-forwarded-for": "203.0.113.10", cookie: "__Host-atlas_auth=session-handle; __Host-atlas_device=device-1", "content-type": "application/x-www-form-urlencoded", "x-request-id": "12345678-1234-1234-1234-123456789012" },
      body: "email=person%40example.com&phone=%2B15555550100",
    }));

    expect(response.status).toBe(503);
    const serialized = JSON.stringify(sql.parameters);
    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("+15555550100");
    expect(serialized).not.toContain("203.0.113.10");
    expect(serialized).not.toContain("session-handle");
    expect(serialized).not.toContain("device-1");
    expect(sql.parameters.find((parameters) => Array.isArray(parameters[1]))?.[1]).toHaveLength(5);
  });

  it("fails closed when durable admission raises a database error", async () => {
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      controlPlane: {
        admit: async () => { throw new Error("database_unavailable"); },
        revokeCurrent: async () => ({ kind: "denied" as const }),
        revokeOthers: async () => ({ kind: "denied" as const }),
      },
    });

    const response = await runtime.handle("login", new Request("https://portal.example/api/auth/login", { method: "POST", headers: { origin: "https://portal.example" } }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ kind: "unavailable" });
  });
});
