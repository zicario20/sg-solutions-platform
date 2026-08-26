export class MfaService {
  async beginEnrollment(): Promise<{ readonly kind: "unavailable" }> {
    return { kind: "unavailable" };
  }
  async challenge(): Promise<{ readonly kind: "unavailable" }> {
    return { kind: "unavailable" };
  }
  async remove(): Promise<{ readonly kind: "unavailable" }> {
    return { kind: "unavailable" };
  }
}
