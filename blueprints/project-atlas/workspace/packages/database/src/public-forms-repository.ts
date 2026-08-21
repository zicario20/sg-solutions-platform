import type {
  AcceptedFormSubmission,
  FormDefinitionVersion,
  FormReceipt,
  PublicFormsRepository,
  ReserveFormReceiptInput,
  ReserveFormReceiptResult,
} from "@atlas/domain";
import postgres from "postgres";

type SqlParameter = string | number | boolean | Date | null;
type SqlRow = Record<string, unknown>;

export interface PublicFormsTransaction {
  unsafe<Row extends SqlRow[]>(statement: string, parameters?: unknown[]): Promise<Row>;
}

export interface PublicFormsSql {
  begin<T>(work: (tx: PublicFormsTransaction) => Promise<T>): Promise<T>;
}

type ReceiptRow = {
  receipt_id: string;
  scope_digest: string;
  command_digest: string;
  reservation_id: string;
  state: "reserved" | "accepted" | "reconciliation_required";
  submission_id: string | null;
  issued_at: Date;
  lease_expires_at: Date;
  accepted_at: Date | null;
};

const DIGEST = /^[0-9a-f]{64}$/u;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
const RESERVATION_LEASE_MS = 45_000;
const SUBMISSION_RETENTION_MS = 90 * 24 * 60 * 60 * 1_000;

async function query<Row extends SqlRow>(
  tx: PublicFormsTransaction,
  statement: string,
  parameters: readonly SqlParameter[] = [],
): Promise<Row[]> {
  return tx.unsafe<Row[]>(statement, [...parameters]);
}

async function withGatewayTransaction<T>(
  sql: PublicFormsSql,
  scopeDigest: string,
  sessionDigest: string,
  work: (tx: PublicFormsTransaction) => Promise<T>,
): Promise<T> {
  if (!DIGEST.test(scopeDigest) || !DIGEST.test(sessionDigest)) {
    throw new Error("PUBLIC_FORMS_DATABASE_SCOPE_INVALID");
  }
  return sql.begin(async (tx) => {
    const principal = (
      await query<{
        session_user_name: string;
        is_member: boolean;
        rolsuper: boolean;
        rolbypassrls: boolean;
      }>(
        tx,
        `select session_user as session_user_name,
          pg_has_role(session_user, 'atlas_public_forms_gateway', 'member') as is_member,
          rol.rolsuper, rol.rolbypassrls
        from pg_roles rol where rol.rolname = session_user limit 1`,
      )
    )[0];
    if (
      principal?.session_user_name !== "atlas_public_forms_runtime" ||
      !principal.is_member ||
      principal.rolsuper ||
      principal.rolbypassrls
    ) {
      throw new Error("PUBLIC_FORMS_DATABASE_PRINCIPAL_UNSAFE");
    }
    await query(tx, "set local role atlas_public_forms_gateway");
    await query(tx, "select set_config('atlas.public_forms_scope_digest', $1, true)", [scopeDigest]);
    await query(tx, "select set_config('atlas.public_forms_session_digest', $1, true)", [sessionDigest]);
    return work(tx);
  });
}

function receiptFromRow(row: ReceiptRow): FormReceipt {
  return Object.freeze({
    status: "accepted",
    receiptId: row.receipt_id,
    issuedAt: new Date(row.issued_at),
  });
}

function assertSubmission(input: AcceptedFormSubmission, scope: string): void {
  if (
    !IDENTIFIER.test(input.submissionId) ||
    !DIGEST.test(scope) ||
    !DIGEST.test(input.sessionBindingDigest) ||
    !DIGEST.test(input.nonceDigest) ||
    !DIGEST.test(input.commandDigest) ||
    input.answers.some(
      (answer) =>
        !answer.ciphertext ||
        !answer.keyReference ||
        (answer.matchDigest !== undefined && !DIGEST.test(answer.matchDigest)),
    )
  ) {
    throw new Error("PUBLIC_FORMS_PERSISTENCE_INPUT_INVALID");
  }
}

export class PostgresPublicFormsRepository implements PublicFormsRepository {
  constructor(private readonly sql: PublicFormsSql) {}

  async loadPublishedDefinition(input: {
    formCode: string;
    version: string;
    locale: "es" | "en";
  }): Promise<FormDefinitionVersion | undefined> {
    return withGatewayTransaction(this.sql, "0".repeat(64), "0".repeat(64), async (tx) => {
      const version = (
        await query<{
          form_code: string;
          version: string;
          locale: "es" | "en";
          audience: "public";
          purpose: FormDefinitionVersion["purpose"];
          status: "published";
          service_code: string | null;
          retention_class: FormDefinitionVersion["retentionClass"];
          schema_hash: string;
          ui_hash: string;
          disclosure_references: FormDefinitionVersion["disclosureReferences"];
          approved_actions: FormDefinitionVersion["approvedActions"];
          consent_requirements: FormDefinitionVersion["consentRequirements"];
        }>(
          tx,
          `select form_code, version, locale, audience, purpose, status, service_code,
            retention_class, schema_hash, ui_hash, disclosure_references,
            approved_actions, consent_requirements
           from form_definition_versions
           where form_code = $1 and version = $2 and locale = $3
             and status = 'published' and audience = 'public' limit 1`,
          [input.formCode, input.version, input.locale],
        )
      )[0];
      if (!version) return undefined;
      const fields = await query<{
        field_code: string;
        field_type: string;
        step: number;
        required: boolean;
        sensitivity: string;
        label_id: string;
        help_text_id: string | null;
        option_codes: readonly string[] | null;
        validation_rules: { minimum?: number; maximum?: number; maxLength?: number };
        conditional_rules: FormDefinitionVersion["fields"][number]["visibleWhen"] | null;
      }>(
        tx,
        `select field_code, field_type, step, required, sensitivity, label_id,
          help_text_id, option_codes, validation_rules, conditional_rules
         from form_field_definitions fields
         join form_definition_versions version on version.id = fields.definition_version_id
         where version.form_code = $1 and version.version = $2 and version.locale = $3
         order by fields.sort_order`,
        [input.formCode, input.version, input.locale],
      );
      return Object.freeze({
        formCode: version.form_code,
        version: version.version,
        locale: version.locale,
        audience: version.audience,
        purpose: version.purpose,
        status: version.status,
        ...(version.service_code ? { serviceCode: version.service_code } : {}),
        retentionClass: version.retention_class,
        schemaHash: version.schema_hash,
        uiHash: version.ui_hash,
        disclosureReferences: Object.freeze([...version.disclosure_references]),
        approvedActions: Object.freeze([...version.approved_actions]),
        consentRequirements: Object.freeze([...version.consent_requirements]),
        fields: Object.freeze(
          fields.map((field) =>
            Object.freeze({
              fieldCode: field.field_code,
              fieldType: field.field_type as FormDefinitionVersion["fields"][number]["fieldType"],
              step: field.step,
              required: field.required,
              sensitivity: field.sensitivity as FormDefinitionVersion["fields"][number]["sensitivity"],
              labelId: field.label_id,
              ...(field.help_text_id ? { helpTextId: field.help_text_id } : {}),
              ...(field.option_codes ? { optionCodes: Object.freeze([...field.option_codes]) } : {}),
              ...field.validation_rules,
              ...(field.conditional_rules ? { visibleWhen: field.conditional_rules } : {}),
            }),
          ),
        ),
      });
    });
  }

  async reserveOrReplay(input: ReserveFormReceiptInput): Promise<ReserveFormReceiptResult> {
    if (
      !DIGEST.test(input.scope) ||
      !DIGEST.test(input.commandDigest) ||
      !IDENTIFIER.test(input.reservationId) ||
      !IDENTIFIER.test(input.proposedReceipt.receiptId)
    ) {
      throw new Error("PUBLIC_FORMS_RESERVATION_INVALID");
    }
    return withGatewayTransaction(this.sql, input.scope, "0".repeat(64), async (tx) => {
      const leaseExpiresAt = new Date(input.proposedReceipt.issuedAt.getTime() + RESERVATION_LEASE_MS);
      const inserted = await query<{ receipt_id: string }>(
        tx,
        `insert into form_submission_receipts (
          receipt_id, scope_digest, command_digest, reservation_id, state,
          submission_id, issued_at, lease_expires_at, accepted_at, created_at, updated_at
        ) values ($1, $2, $3, $4, 'reserved', null, $5, $6, null, $5, $5)
        on conflict (scope_digest) do nothing returning receipt_id`,
        [
          input.proposedReceipt.receiptId,
          input.scope,
          input.commandDigest,
          input.reservationId,
          input.proposedReceipt.issuedAt,
          leaseExpiresAt,
        ],
      );
      if (inserted[0]) return { status: "reserved", reservationId: input.reservationId };
      const row = (
        await query<ReceiptRow>(
          tx,
          `select receipt_id, scope_digest, command_digest, reservation_id, state,
            submission_id, issued_at, lease_expires_at, accepted_at
           from form_submission_receipts where scope_digest = $1 for update`,
          [input.scope],
        )
      )[0];
      if (!row) throw new Error("PUBLIC_FORMS_RESERVATION_LOST");
      const receipt = receiptFromRow(row);
      if (row.command_digest !== input.commandDigest) return { status: "conflict", receipt };
      if (row.state === "accepted") return { status: "replay", receipt };
      if (row.state === "reconciliation_required") return { status: "in_progress", receipt };
      if (row.lease_expires_at.getTime() <= input.proposedReceipt.issuedAt.getTime()) {
        const reclaimed = await query<{ receipt_id: string }>(
          tx,
          `update form_submission_receipts
           set reservation_id = $2, lease_expires_at = $3, updated_at = $4
           where scope_digest = $1 and state = 'reserved' and submission_id is null
             and lease_expires_at <= $4 returning receipt_id`,
          [input.scope, input.reservationId, leaseExpiresAt, input.proposedReceipt.issuedAt],
        );
        if (reclaimed[0]) return { status: "reserved", reservationId: input.reservationId };
      }
      return { status: "in_progress", receipt };
    });
  }

  async commitAcceptedSubmission(input: {
    scope: string;
    reservationId: string;
    submission: AcceptedFormSubmission;
  }): Promise<FormReceipt> {
    assertSubmission(input.submission, input.scope);
    return withGatewayTransaction(
      this.sql,
      input.scope,
      input.submission.sessionBindingDigest,
      async (tx) => {
        const receiptRow = (
          await query<ReceiptRow>(
            tx,
            `select receipt_id, scope_digest, command_digest, reservation_id, state,
              submission_id, issued_at, lease_expires_at, accepted_at
             from form_submission_receipts where scope_digest = $1 for update`,
            [input.scope],
          )
        )[0];
        if (
          !receiptRow ||
          receiptRow.state !== "reserved" ||
          receiptRow.reservation_id !== input.reservationId ||
          receiptRow.command_digest !== input.submission.commandDigest
        ) {
          if (receiptRow?.state === "accepted" && receiptRow.command_digest === input.submission.commandDigest) {
            return receiptFromRow(receiptRow);
          }
          throw new Error("FORM_RESERVATION_CONFLICT");
        }
        const now = input.submission.acceptedAt;
        const expiresAt = new Date(now.getTime() + SUBMISSION_RETENTION_MS);
        await query(
          tx,
          `insert into form_submissions (
            id, form_code, form_version, locale, scope_digest, session_binding_digest,
            nonce_digest, command_digest, status, accepted_at, expires_at,
            deletion_state, legal_hold, created_at, updated_at
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'accepted', $9, $10,
            'retained', false, $9, $9)`,
          [
            input.submission.submissionId,
            input.submission.formCode,
            input.submission.formVersion,
            input.submission.locale,
            input.scope,
            input.submission.sessionBindingDigest,
            input.submission.nonceDigest,
            input.submission.commandDigest,
            now,
            expiresAt,
          ],
        );
        for (const answer of input.submission.answers) {
          await query(
            tx,
            `insert into form_responses (
              submission_id, scope_digest, field_code, value_type, sensitivity,
              ciphertext, key_reference, match_digest, created_at, updated_at
            ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
            [
              input.submission.submissionId,
              input.scope,
              answer.fieldCode,
              answer.valueType,
              answer.sensitivity,
              answer.ciphertext,
              answer.keyReference,
              answer.matchDigest ?? null,
              now,
            ],
          );
        }
        for (const consent of input.submission.consents) {
          await query(
            tx,
            `insert into form_consent_evidence (
              id, submission_id, scope_digest, consent_type, consent_version,
              disclosure_reference, granted, source, session_binding_digest,
              occurred_at, revoked_at, created_at
            ) values ($1, $2, $3, $4, $5, $6, $7, 'public_form', $8, $9, null, $9)`,
            [
              `${input.submission.submissionId}:${consent.consentType}:${consent.version}`,
              input.submission.submissionId,
              input.scope,
              consent.consentType,
              consent.version,
              consent.disclosureReference,
              consent.granted,
              consent.sessionBindingDigest,
              consent.occurredAt,
            ],
          );
        }
        if (input.submission.attribution) {
          const attribution = input.submission.attribution;
          await query(
            tx,
            `insert into form_attribution (
              submission_id, scope_digest, referrer, landing_page, utm_source,
              utm_medium, utm_campaign, utm_term, utm_content, partner_code, created_at
            ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              input.submission.submissionId,
              input.scope,
              attribution.referrer ?? null,
              attribution.landingPage ?? null,
              attribution.utmSource ?? null,
              attribution.utmMedium ?? null,
              attribution.utmCampaign ?? null,
              attribution.utmTerm ?? null,
              attribution.utmContent ?? null,
              attribution.partnerCode ?? null,
              now,
            ],
          );
        }
        for (const command of input.submission.outbox) {
          await query(
            tx,
            `insert into form_outbox (
              command_id, submission_id, scope_digest, owner, operation, form_code,
              locale, service_code, consent_type, channel, idempotency_key, state,
              attempt_count, lease_owner, lease_version, lease_expires_at, available_at,
              completed_at, result_code, created_at, updated_at
            ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending',
              0, null, 0, null, $12, null, null, $12, $12)`,
            [
              command.commandId,
              input.submission.submissionId,
              input.scope,
              command.owner,
              command.operation,
              command.formCode,
              command.locale,
              command.serviceCode ?? null,
              command.consentType ?? null,
              command.channel ?? null,
              command.idempotencyKey,
              now,
            ],
          );
        }
        await query(
          tx,
          `insert into form_audit_events (
            id, submission_id, scope_digest, event_name, result_code,
            form_code, locale, correlation_id, occurred_at, created_at
          ) values ($1, $2, $3, 'submission_accepted', 'accepted', $4, $5, $6, $7, $7)`,
          [
            `${input.submission.submissionId}:accepted`,
            input.submission.submissionId,
            input.scope,
            input.submission.formCode,
            input.submission.locale,
            `form_${input.submission.commandDigest.slice(0, 32)}`,
            now,
          ],
        );
        const completed = await query<ReceiptRow>(
          tx,
          `update form_submission_receipts
           set state = 'accepted', submission_id = $2, accepted_at = $4, updated_at = $4
           where scope_digest = $1 and reservation_id = $3 and state = 'reserved'
           returning receipt_id, scope_digest, command_digest, reservation_id, state,
             submission_id, issued_at, lease_expires_at, accepted_at`,
          [input.scope, input.submission.submissionId, input.reservationId, now],
        );
        if (!completed[0]) throw new Error("FORM_RESERVATION_CONFLICT");
        return receiptFromRow(completed[0]);
      },
    );
  }

  async abandonReservation(input: { scope: string; reservationId: string }): Promise<void> {
    await withGatewayTransaction(this.sql, input.scope, "0".repeat(64), async (tx) => {
      await query(
        tx,
        `delete from form_submission_receipts
         where scope_digest = $1 and reservation_id = $2 and state = 'reserved'
           and submission_id is null`,
        [input.scope, input.reservationId],
      );
    });
  }
}

export function createPublicFormsSql(databaseUrl: string): PublicFormsSql {
  return postgres(databaseUrl, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  }) as unknown as PublicFormsSql;
}
