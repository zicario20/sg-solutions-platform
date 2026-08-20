import { describe, expect, it } from "vitest";
import {
  createAdminSessionGrant,
  requireAdminAccessWithMinimumRole,
  requireAdminAccess,
} from "../../apps/www/src/pages/api/admin/_db";

const headers = (values: Record<string, string>) => new Headers(values);

const makeAdminRequest = ({
  tokenRole,
  requestedRole,
  surface = "admin",
  includeToken = true,
}: {
  tokenRole: "owner" | "admin" | "support";
  requestedRole: "owner" | "admin" | "support";
  surface?: "admin" | (string & {});
  includeToken?: boolean;
}) => {
  const token = includeToken ? createAdminSessionGrant(tokenRole).token : "missing-token";
  return new Request("http://localhost/api/admin/clients", {
    headers: headers({
      "x-atlas-surface": surface,
      "x-admin-role": requestedRole,
      ...(includeToken ? { "x-admin-token": token } : {}),
    }),
  });
};

describe("M001 admin access control", () => {
  it("enforces read routes with support-level minimum", () => {
    const request = makeAdminRequest({
      tokenRole: "support",
      requestedRole: "support",
    });
    const response = requireAdminAccessWithMinimumRole(request, "support");
    expect(response).toBeNull();
  });

  it("blocks support role from admin-level operations", async () => {
    const request = makeAdminRequest({
      tokenRole: "support",
      requestedRole: "support",
    });
    const response = requireAdminAccessWithMinimumRole(request, "admin");
    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
    expect(await response!.text()).toContain("Insufficient admin role");
  });

  it("allows owner role to access admin-level operations even with lower requested role", () => {
    const request = makeAdminRequest({
      tokenRole: "owner",
      requestedRole: "support",
    });
    const response = requireAdminAccessWithMinimumRole(request, "admin");
    expect(response).toBeNull();
  });

  it("rejects admin token when requested role is owner", () => {
    const request = makeAdminRequest({
      tokenRole: "admin",
      requestedRole: "owner",
    });
    const response = requireAdminAccess(request);
    expect(response?.status).toBe(401);
  });
});
