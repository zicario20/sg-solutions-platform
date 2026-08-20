# Task 8 Fix Round 5 Review Package

Base: aa361074437355a27f90d1f25460f9aadb46fd01
Head: e16204c1c8af5b0596c6268637f683171b1cc506

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql b/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql
index f9fcebf..8843d3c 100644
--- a/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql
+++ b/blueprints/project-atlas/workspace/drizzle/0014_m004_typed_withdrawal_evidence.sql
@@ -1,7 +1,7 @@
-ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_id_binding_unique";--> statement-breakpoint
 ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_contact_binding_fk";
 --> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_id_binding_unique";--> statement-breakpoint
 ALTER TABLE "communication_contact_evidence_events" ADD COLUMN "contact_evidence_event_kind" varchar(40) DEFAULT 'contact_withdrawal_recorded' NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_id_binding_kind_unique" UNIQUE("id","binding_id","event_kind");--> statement-breakpoint
 ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_typed_contact_binding_fk" FOREIGN KEY ("contact_evidence_event_id","binding_id","contact_evidence_event_kind") REFERENCES "public"."communication_contact_evidence_events"("id","binding_id","event_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
 ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_contact_kind_valid" CHECK ("communication_contact_evidence_events"."contact_evidence_event_kind" = 'contact_withdrawal_recorded');
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index b7f44c0..8bfc552 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -1036,162 +1036,162 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       existing.command.bindingId === input.command.bindingId &&
       existing.command.conversationId === input.command.conversationId &&
       existing.command.channel === input.command.channel &&
       existing.command.locale === input.command.locale &&
       existing.messageBodyDigest === messageBodyDigest &&
       existing.purpose === input.purpose &&
       existing.templateId === input.templateId
     );
   }
 
   private closeActiveAttempt(
     record: OutboundRecord,
     state: "sent" | "delivered" | "read" | "failed",
     completedAt: Date,
   ): void {
     record.state = state;
     record.command.state = state;
     const attempt = [...this.attempts.values()].find(
       (candidate) => candidate.commandId === record.command.commandId && candidate.state === "dispatching",
     );
     if (attempt) {
       attempt.state = state;
       attempt.completedAt = completedAt;
     }
     record.leaseOwnerHash = undefined;
     record.leaseExpiresAt = undefined;
   }
 
   private validateWithdrawalEvidence(input: WithdrawContactCommand):
     | { status: "allowed"; record: WithdrawalHistoryRecord }
     | { status: "denied"; code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid" } {
     const evidence = input.evidence;
     if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
     const receipt = evidence.receipt;
     if (
       receipt.bindingId !== input.bindingId ||
       !receipt.receiptId ||
       !receipt.correlationId ||
       !currentReceipt(receipt, input.now)
     ) {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
     if (evidence.source === "inbound_event") {
       const inbound = this.inboundById.get(evidence.receipt.eventId);
       if (
         receipt.owner !== "communications" ||
         receipt.operation !== "inbound_opt_out" ||
         !inbound ||
         inbound.envelope.event.bindingId !== input.bindingId ||
         receipt.correlationId !== inbound.envelope.event.correlationId
       ) {
         return { status: "denied", code: "withdrawal_evidence_invalid" };
       }
     } else if (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal") {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
     const prior = this.withdrawalHistory.find((record) => record.receiptId === receipt.receiptId);
     if (
       prior &&
       (prior.bindingId !== input.bindingId ||
         prior.source !== evidence.source ||
         prior.owner !== receipt.owner ||
         prior.operation !== receipt.operation ||
         prior.correlationId !== receipt.correlationId ||
         prior.eventId !== (evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined) ||
         prior.issuedAt.getTime() !== receipt.issuedAt.getTime() ||
         prior.expiresAt.getTime() !== receipt.expiresAt.getTime())
     ) {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
     return {
       status: "allowed",
       record: {
         bindingId: input.bindingId,
         source: evidence.source,
         receiptId: receipt.receiptId,
         owner: receipt.owner,
         operation: receipt.operation,
         eventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
         correlationId: receipt.correlationId,
-        issuedAt: receipt.issuedAt,
-        expiresAt: receipt.expiresAt,
+        issuedAt: new Date(receipt.issuedAt.getTime()),
+        expiresAt: new Date(receipt.expiresAt.getTime()),
         changedAt: input.now,
       },
     };
   }
 
   private validReconciliationReceipt(
     input: ReconcileOutboundCommand,
     receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
     bindingId: string,
     correlationId: string,
   ): boolean {
     return (
       receipt.owner === "communications" &&
       receipt.operation === "dispatch_reconciliation" &&
       (receipt.source === "provider_lookup" || receipt.source === "manual_authority") &&
       receipt.bindingId === bindingId &&
       receipt.commandId === input.commandId &&
       receipt.attemptId === input.attemptId &&
       receipt.correlationId === correlationId &&
       Boolean(receipt.receiptId) &&
       currentReceipt(receipt, input.now)
     );
   }
 
   private reconciliationReceiptIdentity(
     receipt: NonNullable<ReconcileOutboundCommand["receipt"]>,
   ): string {
     return JSON.stringify([
       receipt.receiptId,
       receipt.owner,
       receipt.operation,
       receipt.source,
       receipt.bindingId,
       receipt.commandId,
       receipt.attemptId,
       receipt.outcome,
       receipt.issuedAt.toISOString(),
       receipt.expiresAt.toISOString(),
       receipt.correlationId,
     ]);
   }
 
   private outboundDuplicateReason(
     record: OutboundRecord,
   ): Extract<CreateOutboundResult, { status: "duplicate" }>["reason"] {
     if (record.state === "queued") return undefined;
     if (record.state === "draft") return "outbound_draft_unresolved";
     if (record.state === "dispatching") return "outbound_dispatch_in_progress";
     if (record.state === "dispatch_unknown" || record.state === "reconciliation_required") {
       return "outbound_reconciliation_required";
     }
     if (record.state === "failed") return record.failureCode ?? "outbound_command_failed";
     if (record.state === "cancelled") return "outbound_command_cancelled";
     if (record.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
     return "outbound_command_completed";
   }
 
   private async withBindingLock<T>(
     bindingId: string,
     operation: LockOperation,
     action: () => Promise<T>,
   ): Promise<T> {
     const previous = this.bindingLockTails.get(bindingId) ?? Promise.resolve();
     let release!: () => void;
     const current = new Promise<void>((resolve) => {
       release = resolve;
     });
     this.bindingLockTails.set(bindingId, current);
     await previous;
     try {
       await this.lockBoundary?.({ bindingId, operation });
       return await action();
     } finally {
       release();
       if (this.bindingLockTails.get(bindingId) === current) {
         this.bindingLockTails.delete(bindingId);
       }
     }
   }
 }
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
index 9aaabe7..cc8dd38 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -545,165 +545,172 @@ describe("M004 canonical communications Drizzle schema", () => {
   it("requires exact hexadecimal digests and positive durable ordering values", () => {
     const expectedChecks: Record<string, readonly string[]> = {
       communicationContactBindings: ["communication_contact_bindings_endpoint_digest_valid"],
       communicationProviderEventReceipts: [
         "communication_provider_event_receipts_body_digest_valid",
         "communication_provider_event_receipts_lease_token_hash_valid",
       ],
       communicationEventEnvelopes: ["communication_event_envelopes_media_checksum_valid"],
       communicationOutboundCommands: [
         "communication_outbound_commands_fingerprint_valid",
         "communication_outbound_commands_lease_token_hash_valid",
       ],
       communicationDispatchAttempts: ["communication_dispatch_attempts_request_digest_valid"],
       communicationMessages: ["communication_messages_ordinal_positive"],
       communicationAuditEvents: ["communication_audit_events_sequence_positive"],
     };
     for (const [exportName, checks] of Object.entries(expectedChecks)) {
       expect(
         tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
           (value) => value.name,
         ),
       ).toEqual(expect.arrayContaining(checks));
     }
   });
 });
 
 describe("M004 generated migration authority and canonical cutover", () => {
   it("records generated metadata for bootstrap, backfill, guarded cutover and canonical structure", () => {
     const migrations = currentM004Migrations();
     const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
     const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
       entries: Array<{ idx: number; tag: string }>;
     };
     expect(journal.entries.slice(-9).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
       { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
       { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
       { idx: 8, tag: "0008_m004_communications_backfill" },
       { idx: 9, tag: "0009_m004_communications_cutover_guard" },
       { idx: 10, tag: "0010_m004_communications_canonical_cutover" },
       { idx: 11, tag: "0011_m004_receipt_security_hardening" },
       { idx: 12, tag: "0012_m004_inbound_processing_version_parity" },
       { idx: 13, tag: "0013_m004_contact_withdrawal_evidence" },
       { idx: 14, tag: "0014_m004_typed_withdrawal_evidence" },
     ]);
     for (const index of [
       "0006",
       "0007",
       "0008",
       "0009",
       "0010",
       "0011",
       "0012",
       "0013",
       "0014",
     ]) {
       expect(
         existsSync(
           fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
         ),
       ).toBe(true);
     }
   });
 
   it("generates a typed composite relation for consent-withdrawal evidence", () => {
     const path = fileURLToPath(
       new URL("../../drizzle/0014_m004_typed_withdrawal_evidence.sql", import.meta.url),
     );
     const sql = readFileSync(path, "utf8");
     expect(sql).toContain(
       'ADD COLUMN "contact_evidence_event_kind" varchar(40) DEFAULT \'contact_withdrawal_recorded\' NOT NULL',
     );
     expect(sql).toContain(
       'CONSTRAINT "communication_contact_evidence_events_contact_kind_valid" CHECK ("communication_contact_evidence_events"."contact_evidence_event_kind" = \'contact_withdrawal_recorded\')',
     );
     expect(sql).toContain(
       'CONSTRAINT "communication_contact_evidence_events_id_binding_kind_unique" UNIQUE("id","binding_id","event_kind")',
     );
     expect(sql).toContain(
       'CONSTRAINT "communication_contact_evidence_events_typed_contact_binding_fk" FOREIGN KEY ("contact_evidence_event_id","binding_id","contact_evidence_event_kind") REFERENCES "public"."communication_contact_evidence_events"("id","binding_id","event_kind")',
     );
-    expect(
-      sql.indexOf("communication_contact_evidence_events_id_binding_kind_unique"),
-    ).toBeLessThan(
-      sql.indexOf("communication_contact_evidence_events_typed_contact_binding_fk"),
-    );
+    const orderedConstraintFragments = [
+      'DROP CONSTRAINT "communication_contact_evidence_events_contact_binding_fk"',
+      'DROP CONSTRAINT "communication_contact_evidence_events_id_binding_unique"',
+      'ADD CONSTRAINT "communication_contact_evidence_events_id_binding_kind_unique"',
+      'ADD CONSTRAINT "communication_contact_evidence_events_typed_contact_binding_fk"',
+    ] as const;
+    let priorIndex = -1;
+    for (const fragment of orderedConstraintFragments) {
+      const index = sql.indexOf(fragment);
+      expect(index, `${fragment} must follow its dependency`).toBeGreaterThan(priorIndex);
+      priorIndex = index;
+    }
   });
 
   it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
     const { bootstrap, structural, backfill } = currentM004Migrations();
     const sql = [bootstrap, structural, backfill]
       .map((file) =>
         readFileSync(fileURLToPath(new URL(`../../drizzle/${file}`, import.meta.url)), "utf8"),
       )
       .join("\n");
     for (const exportName of REQUIRED_TABLE_EXPORTS) {
       const name = tableConfig(exportName).name;
       expect(sql).toContain(`ALTER TABLE "${name}" FORCE ROW LEVEL SECURITY`);
       expect(sql).toContain(`"${name}"`);
     }
     expect(sql).toContain("REVOKE ALL ON TABLE");
     expect(sql).toContain("atlas_communications_gateway");
     expect(sql).toContain("NOSUPERUSER");
     expect(sql).toContain("NOBYPASSRLS");
     expect(sql).toContain("NOLOGIN");
     expect(sql).toContain("ARRAY['anon', 'authenticated']");
     expect(sql).not.toContain("FROM PUBLIC, anon, authenticated");
     expect(sql).not.toMatch(/GRANT\s+[^;]*DELETE/iu);
     expect(sql).toContain('GRANT SELECT ON TABLE "public_chat_conversation_sessions"');
     expect(sql).not.toContain('GRANT SELECT, INSERT ON TABLE "public_chat_conversation_sessions"');
   });
 
   it("bootstraps the cluster-global role idempotently before per-database structural DDL", () => {
     const { bootstrap, structural } = currentM004Migrations();
     const bootstrapSql = readFileSync(`${migrationDirectory()}${bootstrap}`, "utf8");
     const structuralSql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
     expect(bootstrapSql).toContain("IF NOT EXISTS");
     expect(bootstrapSql).toContain("CREATE ROLE atlas_communications_gateway");
     expect(bootstrapSql).toContain("ALTER ROLE atlas_communications_gateway");
     expect(structuralSql).not.toMatch(/CREATE\s+ROLE\s+"?atlas_communications_gateway"?/iu);
   });
 
   it("generates the real Meta envelope columns, explicit required checks and binding-channel FK", () => {
     const { structural } = currentM004Migrations();
     const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
     for (const column of [
       "external_message_reference",
       "template_provider_reference",
       "template_provider_version",
       "template_provider_timestamp",
     ]) {
       expect(sql).toContain(`"${column}"`);
     }
     expect(sql).toContain(
       'CONSTRAINT "communication_event_envelopes_schema_version_valid" CHECK ("communication_event_envelopes"."schema_version" = \'meta-envelope.v1\')',
     );
     expect(sql).toContain(
       'CONSTRAINT "communication_event_envelopes_retention_valid" CHECK ("communication_event_envelopes"."body_retention_policy" = \'metadata_only\' and "communication_event_envelopes"."canonical_text" is null)',
     );
     expect(sql).toContain("communication_contact_bindings_id_channel_unique");
     expect(sql).toContain("communication_participants_binding_channel_fk");
     expect(sql).toContain('"consent_state" is not null');
     expect(sql).toContain('"authority_version" is not null');
     expect(sql).toContain('"template_provider_timestamp" is not null');
     expect(sql).not.toContain('"control_kind"');
     expect(sql).not.toContain('"sender_endpoint"');
   });
 
   it("installs one narrowly-scoped audited public-chat bootstrap function", () => {
     const { backfill } = currentM004Migrations();
     const sql = readFileSync(`${migrationDirectory()}${backfill}`, "utf8");
     expect(sql).toContain("atlas_bootstrap_public_chat_conversation");
     expect(sql).toContain("SECURITY DEFINER");
     expect(sql).toContain("SET search_path = pg_catalog, public");
     expect(sql).toContain("REVOKE ALL ON FUNCTION");
     expect(sql).toContain("GRANT EXECUTE ON FUNCTION");
     expect(sql).toContain("public_chat_session_id");
     expect(sql).toContain("M004_BOOTSTRAP_DEFINER_CANNOT_BYPASS_FORCED_RLS");
     expect(sql).toContain("rolbypassrls");
   });
 
   it("backfills M003 exactly and leaves its read/write path and foreign keys intact", () => {
     const { backfill } = currentM004Migrations();
     const sql = readFileSync(
       fileURLToPath(new URL(`../../drizzle/${backfill}`, import.meta.url)),
       "utf8",
diff --git a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
index 4807b5e..7b2d117 100644
--- a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
+++ b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
@@ -907,82 +907,131 @@ export function runCommunicationsRepositoryConformance(
         const after = inspectState ? await inspectState() : await repository.referenceState();
         for (const [purpose, version] of [["transactional", 4], ["service", 3]] as const) {
           expect(after.consentHistory
             .filter((record) => record.bindingId === value.bindingId && record.purpose === purpose)
             .at(-1))
             .toMatchObject({
               state: "withdrawn",
               version,
               authorityReceiptId: undefined,
             });
         }
         expect(after.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
           .toEqual([
             expect.objectContaining({
               bindingId: value.bindingId,
               source: "authority",
               receiptId: receipt.receiptId,
               correlationId: receipt.correlationId,
             }),
           ]);
         expect(after.policies
           .filter((record) => record.bindingId === value.bindingId)
           .every((record) => record.state === "withdrawn"))
           .toBe(true);
         expect(after.outbound).toContainEqual(expect.objectContaining({
           commandId: queued.commandId,
           state: "cancelled",
         }));
         await expect(repository.withdrawContact({
           bindingId: value.bindingId,
           evidence: { source: "authority", receipt },
           now: CONFORMANCE_NOW,
         })).resolves.toMatchObject({ status: "duplicate", cancelledCommandIds: [] });
         const alteredWindowResults = await Promise.all([
           repository.withdrawContact({
             bindingId: value.bindingId,
             evidence: {
               source: "authority",
               receipt: {
                 ...receipt,
                 issuedAt: new Date(receipt.issuedAt.getTime() - 1),
               },
             },
             now: CONFORMANCE_NOW,
           }),
           repository.withdrawContact({
             bindingId: value.bindingId,
             evidence: {
               source: "authority",
               receipt: {
                 ...receipt,
                 expiresAt: new Date(receipt.expiresAt.getTime() + 1),
               },
             },
             now: CONFORMANCE_NOW,
           }),
         ]);
         expect(alteredWindowResults).toEqual([
           { status: "denied", code: "withdrawal_evidence_invalid" },
           { status: "denied", code: "withdrawal_evidence_invalid" },
         ]);
         await expect(repository.withdrawContact({
           bindingId: value.bindingId,
           evidence: {
             source: "authority",
             receipt: { ...receipt, correlationId: `${receipt.correlationId}_mismatch` },
           },
           now: CONFORMANCE_NOW,
         })).resolves.toEqual({ status: "denied", code: "withdrawal_evidence_invalid" });
         const finalState = inspectState ? await inspectState() : await repository.referenceState();
         expect(finalState.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
           .toHaveLength(1);
         expect(finalState.withdrawalHistory.at(-1)).toMatchObject({
           owner: receipt.owner,
           operation: receipt.operation,
           issuedAt: receipt.issuedAt,
           expiresAt: receipt.expiresAt,
         });
       });
     });
+
+    it("owns withdrawal receipt timestamps after persistence", async () => {
+      await withHarness(factory, `${label}-withdrawal-date-ownership`, async ({ repository }) => {
+        const scenario = `${label}-withdrawal-date-ownership`;
+        const value = communicationsConformanceIds(scenario);
+        const issuedAt = new Date(CONFORMANCE_NOW.getTime());
+        const expiresAt = new Date(CONFORMANCE_TOMORROW.getTime());
+        const receipt = {
+          receiptId: `withdrawal_date_ownership_${suffix(scenario)}`,
+          owner: "consent" as const,
+          operation: "contact_withdrawal" as const,
+          bindingId: value.bindingId,
+          issuedAt: new Date(issuedAt.getTime()),
+          expiresAt: new Date(expiresAt.getTime()),
+          correlationId: `withdrawal_date_ownership_${suffix(scenario)}`,
+        };
+        await expect(repository.withdrawContact({
+          bindingId: value.bindingId,
+          evidence: { source: "authority", receipt },
+          now: CONFORMANCE_NOW,
+        })).resolves.toMatchObject({ status: "changed" });
+
+        receipt.issuedAt.setTime(receipt.issuedAt.getTime() - 1);
+        receipt.expiresAt.setTime(receipt.expiresAt.getTime() + 1);
+
+        await expect(repository.withdrawContact({
+          bindingId: value.bindingId,
+          evidence: {
+            source: "authority",
+            receipt: {
+              ...receipt,
+              issuedAt,
+              expiresAt,
+            },
+          },
+          now: CONFORMANCE_NOW,
+        })).resolves.toMatchObject({ status: "duplicate" });
+        const storedState = await repository.referenceState();
+        expect(storedState).toMatchObject({
+          withdrawalHistory: [
+            expect.objectContaining({
+              receiptId: receipt.receiptId,
+              issuedAt,
+              expiresAt,
+            }),
+          ],
+        });
+      });
+    });
   });
 }
```
