export class AuthApplicationFacade {
  constructor(private readonly canonicalOrigin: string) {}
  async postLogin(origin: string | null): Promise<{ readonly status: number; readonly body: { readonly kind: "denied" | "unavailable" } }> {
    if (origin !== this.canonicalOrigin) return { status: 403, body: { kind: "denied" } };
    return { status: 503, body: { kind: "unavailable" } };
  }
}
