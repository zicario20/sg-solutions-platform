import { AuthApplicationFacade } from "./facade.ts";

export { AuthApplicationFacade } from "./facade.ts";

export function createAuthRuntime(
  sessionStore: unknown,
): AuthApplicationFacade | { readonly kind: "unavailable" } {
  return sessionStore ? new AuthApplicationFacade("https://app.example") : { kind: "unavailable" };
}
