import { describe, expect, it } from "vitest";

import {
  createUserAdministrationConfiguration,
  createUserAdministrationRecord,
  createUserInvitation,
  createUserRoleAssignmentRequest,
  requestMfaReset,
  requestScopedImpersonation,
} from "../../packages/user-administration/src/index";

describe("M091 user administration controlled foundation", () => {
  it("does not grant a role or activate access from a user type or invitation", () => {
    const configuration = createUserAdministrationConfiguration({
      permission: "user_administration.record.create",
      code: "STAFF_ADMIN_BASELINE",
    });
    const user = createUserAdministrationRecord({
      permission: "user_administration.record.create",
      userReference: "principal:staff-001",
      configuration,
      userType: "staff",
    });
    const invitation = createUserInvitation({
      permission: "user_administration.invitation.create",
      invitationCode: "INVITATION_001",
      targetContactReference: "contact:staff-001",
      intendedUserType: "staff",
      workspaceReference: "workspace:operations",
      tokenReference: "invite-token-ref:001",
    });
    const roleRequest = createUserRoleAssignmentRequest({
      permission: "user_administration.role_assignment.request",
      requestCode: "ROLE_REQUEST_001",
      user,
      workspaceReference: "workspace:operations",
      roleTemplateReference: "role-template:service-operator",
      scopeReference: "scope:operations",
    });

    expect(user.defaultRoleAssigned).toBe(false);
    expect(invitation.accessReady).toBe(false);
    expect(roleRequest.grantApplied).toBe(false);
    expect(roleRequest.authorizationOwner).toBe("M081");
  });

  it("rejects raw invitation and MFA secret material", () => {
    const configuration = createUserAdministrationConfiguration({
      permission: "user_administration.record.create",
      code: "SECURITY_ADMIN_BASELINE",
    });
    const user = createUserAdministrationRecord({
      permission: "user_administration.record.create",
      userReference: "principal:staff-002",
      configuration,
      userType: "support",
    });

    expect(() =>
      createUserInvitation({
        permission: "user_administration.invitation.create",
        invitationCode: "UNSAFE_INVITATION",
        targetContactReference: "contact:staff-002",
        intendedUserType: "support",
        workspaceReference: "workspace:support",
        tokenReference: "invite-token-ref:002",
        includesRawToken: true,
      }),
    ).toThrow("not raw invitation tokens");

    expect(() =>
      requestMfaReset({
        permission: "user_administration.mfa_reset.request",
        requestCode: "UNSAFE_MFA_RESET",
        user,
        includesRawAuthenticatorMaterial: true,
      }),
    ).toThrow("cannot store authenticator secrets");
  });

  it("prohibits unrestricted impersonation", () => {
    expect(() =>
      requestScopedImpersonation({
        permission: "user_administration.impersonation.request",
        requestCode: "UNSAFE_IMPERSONATION",
        targetUserReference: "principal:client-001",
        unrestricted: true,
      }),
    ).toThrow("Unrestricted impersonation is prohibited");
  });
});
