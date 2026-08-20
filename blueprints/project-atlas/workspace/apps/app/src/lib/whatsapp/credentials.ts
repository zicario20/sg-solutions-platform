export interface MetaCredentialResolver {
  resolveVerificationSecret(
    connectionId: string,
  ): Promise<{ appSecret: string; verifyToken: string }>;
  resolveDispatchSecret(connectionId: string): Promise<{
    accessToken: string;
    phoneNumberId: string;
    graphApiVersion: string;
  }>;
  resolveTemplateConnectionAuthority(input: MetaTemplateAuthorityRequest): Promise<MetaTemplateConnectionAuthority>;
}

export interface MetaTemplateAuthorityRequest {
  connectionId: string;
  businessAccountId: string;
  correlationId: string;
  verifiedAt: Date;
}

export interface MetaTemplateConnectionAuthority {
  connectionId: string;
  businessAccountId: string;
  authorityReceiptId: string;
  authorityVersion: number;
  correlationId: string;
  issuedAt: Date;
  expiresAt: Date;
  templateOwningConnectionCount: number;
}

export class MetaCredentialsUnavailableError extends Error {
  readonly code = "credentials_unavailable" as const;

  constructor() {
    super("Meta credentials are unavailable");
    this.name = "MetaCredentialsUnavailableError";
  }
}

export function createFailClosedMetaCredentialResolver(): MetaCredentialResolver {
  const unavailable = async (): Promise<never> => {
    throw new MetaCredentialsUnavailableError();
  };

  return Object.freeze({
    resolveVerificationSecret: unavailable,
    resolveDispatchSecret: unavailable,
    resolveTemplateConnectionAuthority: unavailable,
  });
}
