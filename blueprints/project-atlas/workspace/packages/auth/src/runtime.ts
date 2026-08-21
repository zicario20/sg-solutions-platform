import type { AuthRuntimeConfig } from "./contracts.ts";
import { createTransactionalAuthControls, type DurableAuthControls } from "./jobs.ts";

export type AuthCommand = "register" | "login" | "logout" | "verify" | "recovery" | "sessions" | "step_up" | "oauth_start" | "oauth_callback";
export type AuthRuntime = { canonicalOrigin: string; execute(command: AuthCommand, input: { origin: string | null }): Promise<{ status: number; body: { kind: "accepted" | "denied" | "unavailable" } }> };

export function createAuthRuntime(input: { canonicalOrigin: string; sessionStore?: unknown; config?: AuthRuntimeConfig; controls?: DurableAuthControls }): AuthRuntime {
  if (!/^https:\/\/[^/?#]+$/u.test(input.canonicalOrigin)) throw new Error("auth_canonical_origin_invalid");
  return {
    canonicalOrigin: input.canonicalOrigin,
    async execute(command, request) {
      if (request.origin !== input.canonicalOrigin) return { status: 403, body: { kind: "denied" } };
      if (command === "logout") return { status: 204, body: { kind: "accepted" } };
      if (command === "register" || command === "recovery" || command === "verify" || command === "login") {
        const admission = await createTransactionalAuthControls(input.controls).admit({ purpose: command, identifierDigest: "server_derived_request" });
        return admission.kind === "accepted" ? { status: 202, body: { kind: "accepted" } } : { status: 503, body: { kind: "unavailable" } };
      }
      return { status: 503, body: { kind: "unavailable" } };
    },
  };
}
