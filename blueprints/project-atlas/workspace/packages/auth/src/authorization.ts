export type AuthorizationActor = Readonly<{
  activeSession: boolean;
  accountId?: string;
  organizationId?: string;
  permissions: readonly string[];
  resourceReceipt?: Readonly<{ accountId: string; organizationId: string; accessVersion: number }>;
  assurance?: "aal1" | "aal2";
}>;

export class AuthorizationService {
  async authorize(actor: AuthorizationActor, permission: string): Promise<{ readonly kind: "allowed" | "denied" }> {
    if (!actor.activeSession || !actor.accountId || !actor.resourceReceipt) return { kind: "denied" };
    if (!actor.permissions.includes(permission)) return { kind: "denied" };
    if (actor.resourceReceipt.accountId !== actor.accountId) return { kind: "denied" };
    if (actor.organizationId && actor.resourceReceipt.organizationId !== actor.organizationId) return { kind: "denied" };
    if (permission.startsWith("admin.") && actor.assurance !== "aal2") return { kind: "denied" };
    return { kind: "allowed" };
  }
}
