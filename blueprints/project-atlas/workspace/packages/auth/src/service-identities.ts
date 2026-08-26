export class ServiceIdentityVerifier {
  constructor(
    private readonly verifier?: {
      verify(
        credential: { readonly audience: string; readonly scopes: readonly string[] },
        requirement: { readonly audience: string; readonly scopes: readonly string[] },
      ): Promise<boolean>;
    },
  ) {}
  async verify(
    credential: { readonly audience: string; readonly scopes: readonly string[] },
    requirement: { readonly audience: string; readonly scopes: readonly string[] },
  ): Promise<{ readonly kind: "allowed" | "denied" }> {
    if (
      !this.verifier ||
      credential.audience !== requirement.audience ||
      !credential.scopes.every((scope) => requirement.scopes.includes(scope))
    )
      return { kind: "denied" };
    return (await this.verifier.verify(credential, requirement))
      ? { kind: "allowed" }
      : { kind: "denied" };
  }
}
