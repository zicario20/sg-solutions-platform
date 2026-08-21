export class ServiceIdentityVerifier {
  async verify(
    credential: { readonly audience: string; readonly scopes: readonly string[] },
    requirement: { readonly audience: string; readonly scopes: readonly string[] },
  ): Promise<{ readonly kind: "allowed" | "denied" }> {
    if (credential.audience !== requirement.audience) return { kind: "denied" };
    return credential.scopes.every((scope) => requirement.scopes.includes(scope))
      ? { kind: "allowed" }
      : { kind: "denied" };
  }
}
