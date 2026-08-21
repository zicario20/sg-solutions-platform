type OutboxCommand = { readonly id: string; readonly purpose: string; state: "pending" | "manual_review" };
export class AuthOutbox {
  private readonly commands = new Map<string, OutboxCommand>();
  async enqueue(input: { readonly id: string; readonly purpose: string }): Promise<void> { this.commands.set(input.id, { ...input, state: "pending" }); }
  setManualReview(): void { for (const command of this.commands.values()) command.state = "manual_review"; }
}
export async function dispatchAuthOutbox(_outbox: AuthOutbox): Promise<{ readonly kind: "pending" }> { return { kind: "pending" }; }
export async function reconcileAuthOutbox(outbox: AuthOutbox, result: "unknown" | "delivered"): Promise<{ readonly kind: "manual_review" | "completed" }> { if (result === "unknown") { outbox.setManualReview(); return { kind: "manual_review" }; } return { kind: "completed" }; }
export async function expireAuthArtifacts(): Promise<{ readonly kind: "expired" }> { return { kind: "expired" }; }
