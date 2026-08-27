import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createReceptionAuditEvent,
  validateReceptionChangeRequest,
} from "../../packages/reception-agent/src/index.ts";

const root = resolve(import.meta.dirname, "../..");

describe("M049 Reception Agent governance and persistence", () => {
  it("requires an approved human change request and keeps an audit chain", () => {
    expect(() =>
      validateReceptionChangeRequest({
        type: "policy_change",
        actorType: "agent",
        humanApprovalReference: "approval:reception@1",
        changeReference: "reception-policy:public@2",
      }),
    ).toThrow(/agent/i);

    const first = createReceptionAuditEvent({
      id: "reception-audit-001",
      eventType: "reception_session_started",
      resourceReference: "reception-session:001@1",
      occurredAt: "2026-08-26T16:00:00.000Z",
      previousHash: null,
    });
    const second = createReceptionAuditEvent({
      id: "reception-audit-002",
      eventType: "reception_handoff_prepared",
      resourceReference: "reception-handoff:001@1",
      occurredAt: "2026-08-26T16:01:00.000Z",
      previousHash: first.hash,
    });

    expect(second.previousHash).toBe(first.hash);
    expect(second.hash).not.toBe(first.hash);
  });

  it("defines RLS-protected reference-only persistence and disabled runtime flags", async () => {
    const [schema, migration, environment, turbo, runtime] = await Promise.all([
      readFile(resolve(root, "packages/database/src/schema/reception-agent.ts"), "utf8"),
      readFile(
        resolve(root, "drizzle/0059_m049_reception_agent_controlled_foundation.sql"),
        "utf8",
      ),
      readFile(resolve(root, ".env.example"), "utf8"),
      readFile(resolve(root, "turbo.json"), "utf8"),
      readFile(resolve(root, "packages/reception-agent/src/runtime.ts"), "utf8"),
    ]);

    expect(schema).toContain("receptionSessions");
    expect(schema).toContain("receptionHandoffPackages");
    expect(schema).toContain(".enableRLS()");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("RESTRICTIVE FOR ALL");
    expect(environment).toMatch(/^M049_RECEPTION_AGENT_ENABLED=false$/m);
    expect(environment).toMatch(/^M049_RECEPTION_PROVIDER_CALLS_ENABLED=false$/m);
    expect(turbo).toContain('"M049_RECEPTION_AGENT_ENABLED"');
    expect(runtime).not.toMatch(/\b(fetch|axios|ollama|twilio)\s*\(/);
  });
});
