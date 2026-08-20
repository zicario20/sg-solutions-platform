# Task 4 fix round 3

## Commits
4d037f8 test(communications): prove reconciliation pair ownership

## Stat
 .../tests/m004/communications-concurrency.test.ts  | 158 ++++++++++++++++++++-
 1 file changed, 157 insertions(+), 1 deletion(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
index 9c6679f..887c891 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
@@ -152,21 +152,21 @@ function createService(repository: any, provider: Record<string, unknown>) {
     provider,
     publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
     contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
     handoff: { request: async () => ({ status: "unavailable" }) },
     providerTimeoutMs: 2_000,
     knowledgeTimeoutMs: 500,
     handoffTimeoutMs: 500,
   });
 }
 
-async function queueOutbound(service: any) {
+async function queueOutbound(service: any, overrides: Record<string, unknown> = {}) {
   return service.queueOutbound({
     channel: "whatsapp",
     locale: "en",
     conversationId: "conversation_1",
     bindingId: "binding_1",
     body: "Synthetic outbound message",
     purpose: "transactional",
     templateId: "template_1",
     idempotencyKey: "outbound_key_1",
     fingerprint: "outbound_fingerprint_1",
@@ -175,20 +175,21 @@ async function queueOutbound(service: any) {
     authorizationReceipt: {
       receiptId: "dispatch_receipt_1",
       owner: "communications",
       operation: "outbound_dispatch",
       bindingId: "binding_1",
       destinationKey: "endpoint_digest_v1",
       issuedAt: NOW,
       expiresAt: TOMORROW,
     },
     correlationId: "correlation_out_1",
+    ...overrides,
   });
 }
 
 describe("atomic opt-out and dispatch fencing", () => {
   it("uses a controlled binding lock so withdrawal wins before a queued dispatch claim", async () => {
     const withdrawalEntered = deferred();
     const releaseWithdrawal = deferred();
     const repository = createRepository({
       lockBoundary: async ({ operation }: { operation: string }) => {
         if (operation === "withdraw_contact") {
@@ -1052,11 +1053,166 @@ describe("controlled inbound opt-out and reconciliation races", () => {
         attemptId: unknown.attemptId,
         receipt: { ...receipt, outcome: "confirmed_not_sent" },
         now: NOW,
       }),
     ).resolves.toEqual({
       status: "conflict",
       code: "reconciliation_receipt_mismatch",
     });
     expect(repository.referenceState()).toEqual(settledState);
   });
+
+  it("rejects cross-command attempt pairings before locking or consuming receipt ids", async () => {
+    const base = repositoryOptions();
+    const reconciliationLocks: Array<{ bindingId: string; operation: string }> = [];
+    const repository = createRepository({
+      bindings: [
+        ...base.bindings,
+        {
+          bindingId: "binding_2",
+          channel: "whatsapp",
+          trustState: "reverified",
+          freshUntil: TOMORROW,
+          createdAt: NOW,
+          updatedAt: NOW,
+        },
+      ],
+      policies: [
+        ...base.policies,
+        {
+          policyId: "policy_2",
+          bindingId: "binding_2",
+          state: "normal",
+          version: 7,
+          fence: 42,
+          updatedAt: NOW,
+        },
+      ],
+      consents: [
+        ...base.consents,
+        {
+          bindingId: "binding_2",
+          purpose: "transactional",
+          state: "granted",
+          version: 1,
+          receipt: {
+            receiptId: "consent_receipt_2",
+            owner: "consent",
+            operation: "consent_confirmation",
+            bindingId: "binding_2",
+            issuedAt: NOW,
+            expiresAt: TOMORROW,
+          },
+          changedAt: NOW,
+        },
+      ],
+      lockBoundary: async (input: { bindingId: string; operation: string }) => {
+        if (input.operation === "reconcile_outbound") reconciliationLocks.push(input);
+      },
+    });
+    const service = createService(repository, {
+      dispatch: async () => {
+        throw new Error("ambiguous");
+      },
+    });
+    const commandA = await queueOutbound(service);
+    const commandB = await queueOutbound(service, {
+      bindingId: "binding_2",
+      idempotencyKey: "outbound_key_2",
+      correlationId: "correlation_out_2",
+      authorizationReceipt: {
+        receiptId: "dispatch_receipt_2",
+        owner: "communications",
+        operation: "outbound_dispatch",
+        bindingId: "binding_2",
+        destinationKey: "endpoint_digest_v1",
+        issuedAt: NOW,
+        expiresAt: TOMORROW,
+      },
+    });
+    const attemptA = await service.dispatchOutbound({
+      commandId: commandA.commandId,
+      leaseOwner: "worker_a",
+      leaseExpiresAt: LATER,
+    });
+    const attemptB = await service.dispatchOutbound({
+      commandId: commandB.commandId,
+      leaseOwner: "worker_b",
+      leaseExpiresAt: LATER,
+    });
+    expect(attemptA).toMatchObject({ status: "dispatch_unknown" });
+    expect(attemptB).toMatchObject({ status: "dispatch_unknown" });
+    const beforeCrossPair = repository.referenceState();
+
+    await expect(
+      repository.reconcileOutbound({
+        commandId: commandA.commandId,
+        attemptId: attemptB.attemptId,
+        receipt: reconciliationReceipt({
+          commandId: commandA.commandId,
+          attemptId: attemptB.attemptId,
+          outcome: "reconciled_accepted",
+          receiptId: "receipt_cross_pair_a",
+        }),
+        now: NOW,
+      }),
+    ).resolves.toEqual({ status: "conflict", code: "reconciliation_binding_mismatch" });
+    expect(repository.referenceState()).toEqual(beforeCrossPair);
+    expect(reconciliationLocks).toEqual([]);
+
+    await expect(
+      repository.reconcileOutbound({
+        commandId: commandA.commandId,
+        attemptId: attemptA.attemptId,
+        receipt: reconciliationReceipt({
+          commandId: commandA.commandId,
+          attemptId: attemptA.attemptId,
+          outcome: "reconciled_accepted",
+          receiptId: "receipt_cross_pair_a",
+        }),
+        now: NOW,
+      }),
+    ).resolves.toEqual({ status: "reconciled", commandState: "reconciled_accepted" });
+    expect(reconciliationLocks).toEqual([
+      { bindingId: "binding_1", operation: "reconcile_outbound" },
+    ]);
+
+    const beforeReversePair = repository.referenceState();
+    await expect(
+      repository.reconcileOutbound({
+        commandId: commandB.commandId,
+        attemptId: attemptA.attemptId,
+        receipt: reconciliationReceipt({
+          commandId: commandB.commandId,
+          attemptId: attemptA.attemptId,
+          outcome: "confirmed_not_sent",
+          receiptId: "receipt_cross_pair_b",
+          bindingId: "binding_2",
+          correlationId: "correlation_out_2",
+        }),
+        now: NOW,
+      }),
+    ).resolves.toEqual({ status: "conflict", code: "reconciliation_binding_mismatch" });
+    expect(repository.referenceState()).toEqual(beforeReversePair);
+    expect(reconciliationLocks).toHaveLength(1);
+
+    await expect(
+      repository.reconcileOutbound({
+        commandId: commandB.commandId,
+        attemptId: attemptB.attemptId,
+        receipt: reconciliationReceipt({
+          commandId: commandB.commandId,
+          attemptId: attemptB.attemptId,
+          outcome: "confirmed_not_sent",
+          receiptId: "receipt_cross_pair_b",
+          bindingId: "binding_2",
+          correlationId: "correlation_out_2",
+        }),
+        now: NOW,
+      }),
+    ).resolves.toEqual({ status: "reconciled", commandState: "confirmed_not_sent" });
+    expect(reconciliationLocks).toEqual([
+      { bindingId: "binding_1", operation: "reconcile_outbound" },
+      { bindingId: "binding_2", operation: "reconcile_outbound" },
+    ]);
+  });
 });
```
