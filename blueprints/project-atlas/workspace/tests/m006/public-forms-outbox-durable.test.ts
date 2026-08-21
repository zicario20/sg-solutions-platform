import { describe, expect, it } from "vitest";

import type { FormCommandDispatchReceipt, FormOutboxLease } from "../../packages/domain/src/public-forms/jobs.ts";
import type { FormOutboxCommand } from "../../packages/domain/src/public-forms/ports.ts";
import { SyntheticFormOutboxStore } from "../../packages/domain/src/public-forms/synthetic-ports.ts";
import {
  PostgresFormOutboxStore,
  type PublicFormsSql,
} from "../../packages/database/src/public-forms-outbox-store.ts";

const NOW = new Date("2026-08-20T12:00:00.000Z");

function command(): FormOutboxCommand {
  return Object.freeze({
    commandId: "form_outbox_durable_01",
    owner: "lead",
    operation: "accept_candidate",
    submissionRef: "form_submission_durable_01",
    formCode: "contact",
    locale: "es",
    idempotencyKey: "form_submission_durable_01:lead:accept_candidate:default",
    state: "pending",
  });
}

describe("M006 durable form outbox", () => {
  it("claims PostgreSQL work with finite leases, attempt ceilings and recovery locking", async () => {
    const statements: string[] = [];
    const sql: PublicFormsSql = {
      async begin(work) {
        return work({
          async unsafe(statement) {
            statements.push(statement.replace(/\s+/gu, " ").trim());
            if (statement.includes("pg_has_role")) {
              return [{ session_user_name: "atlas_public_forms_runtime", is_member: true, rolsuper: false, rolbypassrls: false }] as never;
            }
            if (statement.includes("with candidates")) {
              return [{
                command_id: "form_outbox_durable_01",
                submission_id: "form_submission_durable_01",
                owner: "lead",
                operation: "accept_candidate",
                form_code: "contact",
                locale: "es",
                service_code: null,
                consent_type: null,
                channel: null,
                idempotency_key: "form_submission_durable_01:lead:accept_candidate:default",
                attempt_count: 2,
                lease_owner: "worker_m006_01",
                lease_version: 7,
              }] as never;
            }
            if (statement.includes("from form_consent_evidence")) {
              return [{ consent_type: "privacy_policy" }] as never;
            }
            return [] as never;
          },
        });
      },
    };
    const store = new PostgresFormOutboxStore(sql, { workerId: "worker_m006_01" });

    const leases = await store.lease({
      submissionRef: "form_submission_durable_01",
      now: NOW,
      leaseMs: 30_000,
      limit: 10,
    });

    expect(leases).toEqual([
      expect.objectContaining({
        attempts: 2,
        leaseOwner: "worker_m006_01",
        leaseVersion: 7,
        grantedConsentTypes: ["privacy_policy"],
      }),
    ]);
    expect(statements.join("\n")).toContain("for update skip locked");
    expect(statements.join("\n")).toContain("lease_expires_at <=");
    expect(statements.join("\n")).toContain("attempt_count < max_attempts");
    expect(statements).toContain("set local role atlas_public_forms_outbox");
  });

  it("rejects stale optimistic completion instead of duplicating an owner effect", async () => {
    const sql: PublicFormsSql = {
      async begin(work) {
        return work({
          async unsafe(statement) {
            if (statement.includes("pg_has_role")) {
              return [{ session_user_name: "atlas_public_forms_runtime", is_member: true, rolsuper: false, rolbypassrls: false }] as never;
            }
            return [] as never;
          },
        });
      },
    };
    const store = new PostgresFormOutboxStore(sql, { workerId: "worker_m006_01" });
    const lease = Object.freeze({
      leaseId: "form_lease_01",
      command: command(),
      attempts: 1,
      leaseOwner: "worker_m006_01",
      leaseVersion: 4,
      grantedConsentTypes: Object.freeze(["privacy_policy"]),
      verifiedRevocation: false,
    }) satisfies FormOutboxLease;
    const receipt = Object.freeze({
      commandId: lease.command.commandId,
      idempotencyKey: lease.command.idempotencyKey,
      owner: "lead",
      operation: "accept_candidate",
      status: "linked",
      receiptId: "crm_receipt_01",
    }) satisfies FormCommandDispatchReceipt;

    await expect(store.complete({ lease, receipt, now: NOW })).rejects.toThrowError(
      "FORM_OUTBOX_LEASE_CONFLICT",
    );
  });

  it("moves an ambiguous memory result to unknown/manual reconciliation and never re-leases it", async () => {
    const store = new SyntheticFormOutboxStore({ maxAttempts: 2 });
    await store.enqueue({
      submissionRef: "form_submission_durable_01",
      commands: [command()],
      grantedConsentTypes: ["privacy_policy"],
      now: NOW,
    });
    const lease = (await store.lease({
      submissionRef: "form_submission_durable_01",
      now: NOW,
      leaseMs: 1_000,
      limit: 1,
    }))[0];
    if (!lease) throw new Error("missing synthetic lease");
    await store.markUnknown({
      lease,
      receipt: Object.freeze({
        commandId: lease.command.commandId,
        idempotencyKey: lease.command.idempotencyKey,
        owner: lease.command.owner,
        operation: lease.command.operation,
        status: "unknown",
      }),
      now: NOW,
    });

    expect(store.snapshot("form_submission_durable_01")).toEqual([
      expect.objectContaining({ state: "unknown", attempts: 1, receipt: expect.objectContaining({ status: "unknown" }) }),
    ]);
    expect(
      await store.lease({
        submissionRef: "form_submission_durable_01",
        now: new Date(NOW.getTime() + 60_000),
        leaseMs: 1_000,
        limit: 1,
      }),
    ).toEqual([]);
  });
});
