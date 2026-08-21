export class StepUpService {
  private readonly used = new Set<string>();
  async begin(input: { readonly action: string; readonly sessionFamily: string }): Promise<{ readonly id: string }> { return { id: `${input.sessionFamily}:${input.action}` }; }
  async consume(id: string): Promise<{ readonly kind: "consumed" | "replay_denied" }> { if (this.used.has(id)) return { kind: "replay_denied" }; this.used.add(id); return { kind: "consumed" }; }
}
