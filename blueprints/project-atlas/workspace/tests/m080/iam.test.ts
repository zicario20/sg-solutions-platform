import { describe, expect, it } from "vitest";

import {
  createIamPrincipal,
  createUserAccount,
  evaluateAuthenticationAttempt,
  recordAuthenticationAttempt,
} from "../../packages/iam/src/index";

describe("M080 IAM controlled foundation", () => {
  it("does not provision an active account or authorization grant", () => {
    const principal = createIamPrincipal({
      permission: "iam.principal.create",
      principalReference: "principal:client-1",
      type: "client",
    });
    const account = createUserAccount({
      permission: "iam.account.create",
      accountReference: "account:client-1",
      principal,
    });

    expect(account.status).toBe("provisioning_disabled");
    expect(account.active).toBe(false);
    expect(account.authorizationGranted).toBe(false);
  });

  it("fails closed without authenticating or issuing a session", () => {
    const principal = createIamPrincipal({
      permission: "iam.principal.create",
      principalReference: "principal:staff-1",
      type: "staff",
    });
    const account = createUserAccount({
      permission: "iam.account.create",
      accountReference: "account:staff-1",
      principal,
    });
    const result = evaluateAuthenticationAttempt({
      attempt: recordAuthenticationAttempt({
        permission: "iam.authentication.request",
        attemptId: "attempt-1",
        account,
      }),
    });

    expect(result.authenticated).toBe(false);
    expect(result.sessionIssued).toBe(false);
    expect(result.tokenIssued).toBe(false);
  });

  it("rejects credential material from the foundation", () => {
    const principal = createIamPrincipal({
      permission: "iam.principal.create",
      principalReference: "principal:staff-2",
      type: "staff",
    });
    const account = createUserAccount({
      permission: "iam.account.create",
      accountReference: "account:staff-2",
      principal,
    });

    expect(() =>
      recordAuthenticationAttempt({
        permission: "iam.authentication.request",
        attemptId: "attempt-2",
        account,
        includesSecretMaterial: true,
      }),
    ).toThrow("cannot receive authentication secret material");
  });
});
