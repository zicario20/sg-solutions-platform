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
    void actor;
    void permission;
    return { kind: "denied" };
  }
}

export type AuthoritativeGrant = { activeSession: boolean; accountId: string; accessEpoch: number; permissions: readonly string[]; resource: { accountId: string; organizationId: string; accessEpoch: number } };
export class AuthoritativeAuthorizationService {
  constructor(private readonly repository: { load(input: { sessionId: string; resourceId: string }): Promise<AuthoritativeGrant | undefined> }) {}
  async authorize(input: { sessionId: string; resourceId: string; permission: string }): Promise<{ kind: "allowed" | "denied" }> {
    const grant = await this.repository.load({ sessionId: input.sessionId, resourceId: input.resourceId });
    if (!grant || !grant.activeSession || grant.resource.accountId !== grant.accountId || grant.resource.accessEpoch !== grant.accessEpoch || !grant.permissions.includes(input.permission)) return { kind: "denied" };
    return { kind: "allowed" };
  }
}
