export interface MetaCredentialResolver {
  resolveVerificationSecret(
    connectionId: string,
  ): Promise<{ appSecret: string; verifyToken: string }>;
  resolveDispatchSecret(connectionId: string): Promise<{
    accessToken: string;
    phoneNumberId: string;
    graphApiVersion: string;
  }>;
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
  });
}
