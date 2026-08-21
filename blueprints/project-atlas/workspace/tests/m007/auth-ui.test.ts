import { AuthField, authFormAttributes } from "@atlas/ui";
import { describe, expect, it } from "vitest";

describe("M007 auth UI", () => {
  it("renders label-associated password-manager fields and a safe route action", () => {
    const field = AuthField({ label: "Password", type: "password", autoComplete: "current-password" });
    const children = field.props.children as readonly { props: Record<string, unknown> }[];
    expect(children[0]?.props.htmlFor).toBe("password");
    expect(children[1]?.props.autoComplete).toBe("current-password");
    expect(authFormAttributes("sign-in")).toEqual({ action: "/api/auth/login", method: "post" });
  });
});
