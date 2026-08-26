import {
  type ClientActionDto,
  DashboardContractError,
  type DashboardPriorityInput,
  PRIORITY_POLICY_VERSION,
  type PrioritySourceCode,
  selectDashboardPriority,
} from "@atlas/dashboard";
import { describe, expect, it } from "vitest";

const sourceCodes: readonly PrioritySourceCode[] = [
  "security",
  "payments",
  "documents",
  "tasks",
  "appointments",
  "services",
  "notifications",
];

const action = (
  type: ClientActionDto["type"],
  opaqueRef: string,
  overrides: Partial<ClientActionDto> = {},
): ClientActionDto => ({
  type,
  opaqueRef,
  title: "Safe action",
  blocking: false,
  workflowPriority: 10,
  createdAt: "2026-08-20T12:00:00.000Z",
  routeKey:
    type === "security_identity"
      ? "security"
      : type === "blocking_payment"
        ? "payments"
        : "services",
  ...overrides,
});

function input(changes: Partial<DashboardPriorityInput> = {}): DashboardPriorityInput {
  return Object.fromEntries(
    sourceCodes
      .map((code) => [code, { state: "empty", candidates: [] }])
      .concat(Object.entries(changes)),
  ) as DashboardPriorityInput;
}

describe("M008 deterministic priority", () => {
  it("selects security before payment and task actions", () => {
    const result = selectDashboardPriority(
      input({
        security: { state: "fresh", candidates: [action("security_identity", "security-1")] },
        payments: {
          state: "fresh",
          candidates: [action("blocking_payment", "payment-1", { blocking: true })],
        },
        tasks: { state: "fresh", candidates: [action("due_task", "task-1")] },
      }),
    );
    expect(result).toMatchObject({ kind: "action", action: { type: "security_identity" } });
    expect(result.policyVersion).toBe(PRIORITY_POLICY_VERSION);
  });

  it("does not claim a payment action while security is unavailable", () => {
    expect(
      selectDashboardPriority(
        input({
          security: { state: "unavailable", candidates: [] },
          payments: {
            state: "fresh",
            candidates: [action("blocking_payment", "payment-1", { blocking: true })],
          },
        }),
      ),
    ).toEqual({
      kind: "unconfirmed",
      safeReason: "required_source_unavailable",
      policyVersion: "m008.v1",
    });
  });

  it("rejects an action with a route outside the registry", () => {
    expect(() =>
      selectDashboardPriority(
        input({
          tasks: {
            state: "fresh",
            candidates: [action("due_task", "task-1", { routeKey: "admin" as never })],
          },
        }),
      ),
    ).toThrow(DashboardContractError);
  });

  it("uses stable opaque ID as the final tie-break", () => {
    const laterFirst = [action("general_action", "z-action"), action("general_action", "a-action")];
    const result = selectDashboardPriority(
      input({ notifications: { state: "fresh", candidates: laterFirst } }),
    );
    expect(result).toMatchObject({ kind: "action", action: { opaqueRef: "a-action" } });
  });
});
