export class IdentityLinkService {
  async link(input: {
    readonly recentAuthentication: boolean;
  }): Promise<{ readonly kind: "linked" | "denied" }> {
    return input.recentAuthentication ? { kind: "linked" } : { kind: "denied" };
  }

  async reconcile(input: {
    readonly localLink: boolean;
  }): Promise<{ readonly kind: "linked" | "reconciling" }> {
    return input.localLink ? { kind: "linked" } : { kind: "reconciling" };
  }

  async unlink(input: {
    readonly remainingMethods: number;
  }): Promise<{ readonly kind: "unlinked" | "denied" }> {
    return input.remainingMethods > 1 ? { kind: "unlinked" } : { kind: "denied" };
  }
}
