import { createOpaqueValue, digestOpaqueProof } from "./crypto.ts";
import type { OfficialSupabaseIdentity } from "./supabase-provider.ts";

export type CrmPartyResolutionEvidence =
  | { readonly kind: "linked"; readonly relationshipReceipt: string; readonly partyId: string }
  | { readonly kind: "possible_match" | "conflict"; readonly partyId?: string }
  | { readonly kind: "unavailable" };

export type PersistentOAuthAccountRepository = Readonly<{
  storeSupabaseEvidence(input: {
    readonly id: string;
    readonly identity: OfficialSupabaseIdentity;
    readonly verifiedAt: Date;
  }): Promise<void>;
  storeCrmEvidence(input: {
    readonly id: string;
    readonly supabaseEvidenceId: string;
    readonly resolution: CrmPartyResolutionEvidence;
    readonly verifiedAt: Date;
    readonly expiresAt: Date;
  }): Promise<void>;
  authenticate(input: {
    readonly supabaseEvidenceId: string;
    readonly crmEvidenceId: string;
    readonly expectedIssuer: string;
    readonly expectedAudience: string;
    readonly accountId: string;
    readonly externalIdentityId: string;
    readonly partyLinkId: string;
    readonly conflictId: string;
    readonly session: {
      readonly id: string;
      readonly handleDigest: string;
      readonly familyId: string;
      readonly assurance: "aal1";
      readonly idleExpiresAt: Date;
      readonly absoluteExpiresAt: Date;
    };
    readonly now: Date;
  }): Promise<{ readonly kind: "authenticated"; readonly accountId: string } | { readonly kind: "denied" | "manual_review" }>;
}>;

export function createPersistentOAuthAccountService(
  options: {
    readonly repository: PersistentOAuthAccountRepository;
    readonly issuer: string;
    readonly audience: string;
    readonly resolveCrm: (input: { readonly subject: string; readonly supabaseEvidenceId: string }) => Promise<CrmPartyResolutionEvidence>;
  },
  now = () => new Date(),
) {
  return {
    async authenticate(identity: OfficialSupabaseIdentity): Promise<
      | { readonly kind: "authenticated"; readonly accountId: string; readonly handle: string; readonly handleDigest: string }
      | { readonly kind: "denied" | "manual_review" }
    > {
      const verifiedAt = now();
      if (
        identity.provider !== "google" ||
        identity.issuer !== options.issuer ||
        identity.audience !== options.audience ||
        !identity.subject ||
        !identity.emailVerified ||
        identity.expiresAt <= verifiedAt.getTime()
      ) return { kind: "denied" };

      const supabaseEvidenceId = createOpaqueValue();
      await options.repository.storeSupabaseEvidence({ id: supabaseEvidenceId, identity, verifiedAt });
      let resolution: CrmPartyResolutionEvidence;
      try {
        resolution = await options.resolveCrm({ subject: identity.subject, supabaseEvidenceId });
      } catch {
        resolution = { kind: "unavailable" };
      }
      const crmEvidenceId = createOpaqueValue();
      await options.repository.storeCrmEvidence({
        id: crmEvidenceId,
        supabaseEvidenceId,
        resolution,
        verifiedAt,
        expiresAt: new Date(verifiedAt.getTime() + 10 * 60_000),
      });

      const handle = createOpaqueValue();
      const handleDigest = digestOpaqueProof(handle);
      const result = await options.repository.authenticate({
        supabaseEvidenceId,
        crmEvidenceId,
        expectedIssuer: options.issuer,
        expectedAudience: options.audience,
        accountId: createOpaqueValue(),
        externalIdentityId: createOpaqueValue(),
        partyLinkId: createOpaqueValue(),
        conflictId: createOpaqueValue(),
        session: {
          id: createOpaqueValue(),
          handleDigest,
          familyId: createOpaqueValue(),
          assurance: "aal1",
          idleExpiresAt: new Date(verifiedAt.getTime() + 30 * 60_000),
          absoluteExpiresAt: new Date(verifiedAt.getTime() + 8 * 60 * 60_000),
        },
        now: verifiedAt,
      });
      return result.kind === "authenticated" ? { ...result, handle, handleDigest } : result;
    },
  };
}
