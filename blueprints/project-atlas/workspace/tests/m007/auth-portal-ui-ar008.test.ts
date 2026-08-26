import { authCopy } from "@atlas/i18n";
import {
  AccountSecurityView,
  InvitationAcceptView,
  OAuthOutcomeView,
  RecoveryView,
  RegisterView,
  ResetPasswordView,
  SignInView,
  VerifyEmailView,
} from "@atlas/ui";
import { describe, expect, it } from "vitest";
import { createAuthSessionPageLoader } from "../../apps/app/src/lib/auth/http.ts";

type ElementNode = {
  readonly type: string | ((props: never) => unknown);
  readonly props: Record<string, unknown> & { readonly children?: unknown };
};
const isElement = (node: unknown): node is ElementNode =>
  Boolean(node && typeof node === "object" && "type" in node && "props" in node);
function accessibilityTree(node: unknown, result: ElementNode[] = []): ElementNode[] {
  if (Array.isArray(node)) {
    for (const child of node) accessibilityTree(child, result);
    return result;
  }
  if (!isElement(node)) return result;
  if (typeof node.type === "function")
    return accessibilityTree(node.type(node.props as never), result);
  result.push(node);
  accessibilityTree(node.props.children, result);
  return result;
}

const props = {
  locale: "en" as const,
  copy: authCopy.en,
  csrf: "csrf-token",
  outcome: "denied" as const,
};
const forms = (view: unknown) => accessibilityTree(view).filter((node) => node.type === "form");
const controls = (form: ElementNode) =>
  accessibilityTree(form).filter((node) => node.type === "input" || node.type === "button");

describe("AR-008 bilingual auth portal UI", () => {
  it("wires every auth form to its real handler with named CSRF-protected controls", () => {
    const cases = [
      [SignInView(props), "/api/auth/login", ["csrf", "email", "password"]],
      [
        RegisterView(props),
        "/api/auth/register",
        ["csrf", "email", "password", "password_confirmation"],
      ],
      [RecoveryView(props), "/api/auth/recovery", ["csrf", "email"]],
      [
        ResetPasswordView(props),
        "/api/auth/reset",
        ["csrf", "code", "new_password", "password_confirmation"],
      ],
      [VerifyEmailView(props), "/api/auth/verify", ["csrf", "code"]],
      [InvitationAcceptView(props), "/api/auth/invitations/accept", ["csrf", "id", "code"]],
    ] as const;

    for (const [view, action, expectedNames] of cases) {
      const form = forms(view).find((candidate) => candidate.props.action === action);
      expect(form?.props.method).toBe("post");
      expect(
        controls(form!)
          .filter((control) => control.type === "input")
          .map((control) => control.props.name),
      ).toEqual(expectedNames);
    }
    expect(
      forms(SignInView(props)).some((form) => form.props.action === "/api/auth/oauth/google/start"),
    ).toBe(true);
  });

  it("exposes a coherent accessibility tree with associated labels, announced errors, autocomplete, and language control", () => {
    const tree = accessibilityTree(SignInView(props));
    const inputs = tree.filter((node) => node.type === "input" && node.props.type !== "hidden");
    const labels = tree.filter((node) => node.type === "label");
    const alert = tree.find((node) => node.props.role === "alert");
    expect(tree.some((node) => node.type === "main" && node.props.id === "auth-main")).toBe(true);
    expect(inputs.map((input) => input.props.autoComplete)).toEqual(["email", "current-password"]);
    expect(
      inputs.every((input) => labels.some((label) => label.props.htmlFor === input.props.id)),
    ).toBe(true);
    expect(alert?.props.tabIndex).toBe(-1);
    expect(alert?.props.autoFocus).toBeUndefined();
    expect(forms(SignInView(props)).some((form) => form.props.action === "/api/auth/locale")).toBe(
      true,
    );
  });

  it("renders account security, active sessions, revoke actions, and allowlisted OAuth outcomes", () => {
    const security = AccountSecurityView({
      ...props,
      sessions: [{ id: "session-1", current: true, createdAtLabel: "Today" }],
    });
    const actions = forms(security).map((form) => form.props.action);
    expect(actions).toContain("/api/auth/logout");
    expect(actions).toContain("/api/auth/sessions");
    expect(
      accessibilityTree(security).some(
        (node) => node.type === "table" && node.props["aria-label"] === authCopy.en.activeSessions,
      ),
    ).toBe(true);
    expect(
      accessibilityTree(OAuthOutcomeView({ ...props, outcome: "manual_review" })).some(
        (node) => node.props.role === "status",
      ),
    ).toBe(true);
  });

  it("loads active sessions from the durable server adapter and fails closed without a handle", async () => {
    const loader = createAuthSessionPageLoader(async () => ({
      sessions: {
        list: async () => [
          { id: "session-1", createdAt: new Date("2026-08-21T10:00:00.000Z"), current: true },
        ],
      },
    }));
    await expect(loader("session-handle")).resolves.toEqual([
      { id: "session-1", createdAt: new Date("2026-08-21T10:00:00.000Z"), current: true },
    ]);
    await expect(loader("")).resolves.toEqual([]);
  });
});
