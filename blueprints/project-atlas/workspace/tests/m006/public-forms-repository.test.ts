import {
  PostgresPublicFormsRepository,
  type PublicFormsSql,
  type PublicFormsTransaction,
} from "@atlas/database";
import type { AcceptedFormSubmission, FormReceipt } from "@atlas/domain";
import { describe, expect, it } from "vitest";

type ReceiptRow = {
  receipt_id: string;
  scope_digest: string;
  command_digest: string;
  reservation_id: string;
  state: "reserved" | "accepted";
  issued_at: Date;
  lease_expires_at: Date;
};

class FakeTransaction implements PublicFormsTransaction {
  receipt?: ReceiptRow;
  statements: string[] = [];

  async unsafe<Row extends Record<string, unknown>[]>(
    statement: string,
    parameters: unknown[] = [],
  ): Promise<Row> {
    const sql = statement.replace(/\s+/gu, " ").trim();
    this.statements.push(sql);
    if (sql.includes("pg_has_role")) {
      return [
        {
          session_user_name: "atlas_public_forms_runtime",
          is_member: true,
          rolsuper: false,
          rolbypassrls: false,
        },
      ] as Row;
    }
    if (sql.startsWith("set local role") || sql.includes("set_config")) return [] as Row;
    if (sql.startsWith("insert into form_submission_receipts")) {
      if (this.receipt) return [] as Row;
      this.receipt = {
        receipt_id: String(parameters[0]),
        scope_digest: String(parameters[1]),
        command_digest: String(parameters[2]),
        reservation_id: String(parameters[3]),
        state: "reserved",
        issued_at: parameters[4] as Date,
        lease_expires_at: parameters[5] as Date,
      };
      return [{ receipt_id: this.receipt.receipt_id }] as Row;
    }
    if (sql.includes("from form_submission_receipts") && sql.startsWith("select")) {
      return (this.receipt ? [this.receipt] : []) as Row;
    }
    if (sql.startsWith("update form_submission_receipts") && sql.includes("state = 'accepted'")) {
      if (this.receipt && this.receipt.reservation_id === parameters[2]) {
        this.receipt.state = "accepted";
        return [this.receipt] as Row;
      }
      return [] as Row;
    }
    if (sql.startsWith("delete from form_submission_receipts")) {
      this.receipt = undefined;
      return [] as Row;
    }
    return [] as Row;
  }
}

function fakeSql(tx: FakeTransaction): PublicFormsSql {
  return { begin: async (work) => work(tx) };
}

const receipt: FormReceipt = {
  status: "accepted",
  receiptId: "form_receipt_0000000000000001",
  issuedAt: new Date("2026-08-20T20:00:00.000Z"),
};

const submission: AcceptedFormSubmission = {
  submissionId: "form_submission_000000000001",
  receipt,
  formCode: "contact",
  formVersion: "1.0.0",
  locale: "es",
  sessionBindingDigest: "a".repeat(64),
  nonceDigest: "b".repeat(64),
  commandDigest: "c".repeat(64),
  answers: [
    {
      fieldCode: "email",
      valueType: "string",
      sensitivity: "basic_personal",
      ciphertext: "encrypted-envelope-v1",
      keyReference: "forms_key_v1",
      matchDigest: "d".repeat(64),
    },
  ],
  consents: [
    {
      consentType: "service_contact",
      version: "1.0.0",
      disclosureReference: "service_contact_v1",
      granted: true,
      source: "public_form",
      sessionBindingDigest: "a".repeat(64),
      occurredAt: new Date("2026-08-20T20:00:00.000Z"),
    },
  ],
  outbox: [
    {
      commandId: "form_outbox_000000000000001",
      owner: "lead",
      operation: "accept_candidate",
      submissionRef: "form_submission_000000000001",
      formCode: "contact",
      locale: "es",
      idempotencyKey: "form_submission_000000000001:lead:accept_candidate:default",
      state: "pending",
    },
  ],
  acceptedAt: new Date("2026-08-20T20:00:00.000Z"),
};

describe("M006 PostgreSQL public forms repository", () => {
  it("commits a protected submission and replays the durable receipt", async () => {
    const tx = new FakeTransaction();
    const repository = new PostgresPublicFormsRepository(fakeSql(tx));
    const reserved = await repository.reserveOrReplay({
      scope: "e".repeat(64),
      commandDigest: submission.commandDigest,
      reservationId: "form_reservation_0000000001",
      proposedReceipt: receipt,
    });
    expect(reserved).toMatchObject({ status: "reserved" });

    await expect(
      repository.commitAcceptedSubmission({
        scope: "e".repeat(64),
        reservationId: "form_reservation_0000000001",
        submission,
      }),
    ).resolves.toEqual(receipt);

    await expect(
      repository.reserveOrReplay({
        scope: "e".repeat(64),
        commandDigest: submission.commandDigest,
        reservationId: "form_reservation_0000000002",
        proposedReceipt: { ...receipt, receiptId: "form_receipt_0000000000000002" },
      }),
    ).resolves.toEqual({ status: "replay", receipt });

    expect(
      tx.statements.some((statement) => statement.startsWith("insert into form_responses")),
    ).toBe(true);
    expect(tx.statements.join("\n")).not.toContain("PERSON@Example.com");
  });

  it("fails closed for a privileged or unexpected database principal", async () => {
    const tx = new FakeTransaction();
    tx.unsafe = async () =>
      [
        {
          session_user_name: "postgres",
          is_member: true,
          rolsuper: true,
          rolbypassrls: true,
        },
      ] as never;
    const repository = new PostgresPublicFormsRepository(fakeSql(tx));
    await expect(
      repository.reserveOrReplay({
        scope: "e".repeat(64),
        commandDigest: submission.commandDigest,
        reservationId: "form_reservation_0000000001",
        proposedReceipt: receipt,
      }),
    ).rejects.toThrow("PUBLIC_FORMS_DATABASE_PRINCIPAL_UNSAFE");
  });
});
