import { describe, expect, it } from "vitest";

import {
  composeNavigation,
  createCanonicalRoute,
  createInformationSurface,
  createRouteNamespace,
  resolveRoute,
} from "../../packages/information-architecture/src/index";

describe("M086 information architecture controlled foundation", () => {
  it("does not activate a route or expose navigation", () => {
    const surface = createInformationSurface({
      permission: "ia.surface.create",
      code: "CLIENT",
      type: "client",
    });
    const namespace = createRouteNamespace({
      permission: "ia.namespace.create",
      code: "CLIENT_ROOT",
      surface,
      pathPrefix: "/client",
    });
    const route = createCanonicalRoute({
      permission: "ia.route.create",
      routeCode: "CLIENT_DASHBOARD",
      namespace,
      pathTemplate: "/client/dashboard",
    });

    expect(route.active).toBe(false);
    expect(route.authorizationEnforced).toBe(false);
  });

  it("rejects sensitive data in route paths", () => {
    const surface = createInformationSurface({
      permission: "ia.surface.create",
      code: "ADMIN",
      type: "admin",
    });

    expect(() =>
      createRouteNamespace({
        permission: "ia.namespace.create",
        code: "UNSAFE",
        surface,
        pathPrefix: "/admin?token=secret",
      }),
    ).toThrow("without query data or sensitive parameters");
  });

  it("does not guess a destination or redirect a route", () => {
    const result = resolveRoute({ permission: "ia.resolve", requestedPath: "/client/services" });

    expect(result.status).toBe("review_required");
    expect(result.routeResolved).toBe(false);
    expect(result.redirectPerformed).toBe(false);
  });
});
