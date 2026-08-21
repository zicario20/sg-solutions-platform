type OutboxCommand = { readonly id: string; readonly purpose: string; state: "pending" | "manual_review" };
export class AuthOutbox {
  private readonly commands = new Map<string, OutboxCommand>();
  async enqueue(input: { readonly id: string; readonly purpose: string }): Promise<void> { this.commands.set(input.id, { ...input, state: "pending" }); }
  setManualReview(): void { for (const command of this.commands.values()) command.state = "manual_review"; }
}
export async function dispatchAuthOutbox(_outbox: AuthOutbox): Promise<{ readonly kind: "pending" }> { return { kind: "pending" }; }
export async function reconcileAuthOutbox(outbox: AuthOutbox, result: "unknown" | "delivered"): Promise<{ readonly kind: "manual_review" | "completed" }> { if (result === "unknown") { outbox.setManualReview(); return { kind: "manual_review" }; } return { kind: "completed" }; }
export async function expireAuthArtifacts(): Promise<{ readonly kind: "expired" }> { return { kind: "expired" }; }

export type DurableAuthControls = { consumeRate(input: { purpose: string; identifierDigest: string }): Promise<boolean>; appendAudit(input: { event: string }): Promise<void>; enqueue(input: { purpose: string }): Promise<void> };
export function createTransactionalAuthControls(controls?: DurableAuthControls) {
  return {
    async assertContext(context: { sessionId: string; accountId: string; verified: true } | undefined) { if (!context?.verified || !context.sessionId || !context.accountId) throw new Error("AUTH_CONTEXT_DENIED"); },
    async admit(input: { purpose: string; identifierDigest: string }): Promise<{ kind: "accepted" | "unavailable" }> { if (!controls) return { kind: "unavailable" }; if (!(await controls.consumeRate(input))) return { kind: "unavailable" }; await controls.appendAudit({ event: `${input.purpose}_admitted` }); await controls.enqueue({ purpose: input.purpose }); return { kind: "accepted" }; },
  };
}
