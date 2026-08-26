import {
  type ClientActionDto,
  type ClientActionType,
  DashboardContractError,
  isDashboardRouteKey,
  type PriorityResult,
} from "./contracts.ts";

export const PRIORITY_POLICY_VERSION = "m008.v1" as const;

export const PRIORITY_SOURCE_REGISTRY = Object.freeze({
  security: { highestBand: 1, allowedTypes: ["security_identity"] },
  payments: { highestBand: 2, allowedTypes: ["blocking_payment", "general_action"] },
  documents: {
    highestBand: 3,
    allowedTypes: ["expired_document", "pending_signature", "general_action"],
  },
  tasks: { highestBand: 5, allowedTypes: ["due_task", "missing_information", "general_action"] },
  appointments: { highestBand: 6, allowedTypes: ["imminent_appointment", "general_action"] },
  services: { highestBand: 7, allowedTypes: ["missing_information", "general_action"] },
  notifications: { highestBand: 8, allowedTypes: ["general_action"] },
} satisfies Readonly<
  Record<string, Readonly<{ highestBand: number; allowedTypes: readonly ClientActionType[] }>>
>);

export type PrioritySourceCode = keyof typeof PRIORITY_SOURCE_REGISTRY;
export type DashboardPrioritySource = Readonly<{
  state: "fresh" | "empty" | "stale" | "unavailable";
  candidates: readonly ClientActionDto[];
}>;
export type DashboardPriorityInput = Readonly<Record<PrioritySourceCode, DashboardPrioritySource>>;

const bands: Readonly<Record<ClientActionType, number>> = Object.freeze({
  security_identity: 1,
  blocking_payment: 2,
  expired_document: 3,
  pending_signature: 4,
  due_task: 5,
  imminent_appointment: 6,
  missing_information: 7,
  general_action: 8,
});

const sourceCodes = Object.freeze(Object.keys(PRIORITY_SOURCE_REGISTRY) as PrioritySourceCode[]);
const sourceStates = new Set(["fresh", "empty", "stale", "unavailable"]);

function validateAction(source: PrioritySourceCode, action: ClientActionDto): void {
  const registry = PRIORITY_SOURCE_REGISTRY[source];
  if (
    !(registry.allowedTypes as readonly ClientActionType[]).includes(action.type) ||
    !isDashboardRouteKey(action.routeKey)
  )
    throw new DashboardContractError();
  if (
    !action.opaqueRef ||
    action.opaqueRef.length > 256 ||
    !action.title ||
    action.title.length > 256
  )
    throw new DashboardContractError();
  if (!Number.isInteger(action.workflowPriority) || !Number.isFinite(Date.parse(action.createdAt)))
    throw new DashboardContractError();
  if (action.dueAt !== undefined && !Number.isFinite(Date.parse(action.dueAt)))
    throw new DashboardContractError();
}

function validateInput(input: DashboardPriorityInput): void {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new DashboardContractError();
  const keys = Object.keys(input);
  if (
    keys.length !== sourceCodes.length ||
    keys.some((key) => !sourceCodes.includes(key as PrioritySourceCode))
  )
    throw new DashboardContractError();
  for (const source of sourceCodes) {
    const value = input[source];
    if (
      !value ||
      !sourceStates.has(value.state) ||
      !Array.isArray(value.candidates) ||
      value.candidates.length > 5
    )
      throw new DashboardContractError();
    if (value.state === "empty" && value.candidates.length !== 0)
      throw new DashboardContractError();
    for (const candidate of value.candidates) validateAction(source, candidate);
  }
}

const instant = (value: string | undefined): number =>
  value === undefined ? Number.POSITIVE_INFINITY : Date.parse(value);

function compare(left: ClientActionDto, right: ClientActionDto): number {
  return (
    bands[left.type] - bands[right.type] ||
    Number(right.blocking) - Number(left.blocking) ||
    instant(left.dueAt) - instant(right.dueAt) ||
    right.workflowPriority - left.workflowPriority ||
    Date.parse(left.createdAt) - Date.parse(right.createdAt) ||
    left.opaqueRef.localeCompare(right.opaqueRef, "en")
  );
}

export function selectDashboardPriority(input: DashboardPriorityInput): PriorityResult {
  validateInput(input);
  const candidates = sourceCodes.flatMap((source) =>
    input[source].state === "fresh" ? [...input[source].candidates] : [],
  );
  candidates.sort(compare);
  const selected = candidates[0];
  const selectedBand = selected ? bands[selected.type] : Number.POSITIVE_INFINITY;
  const incompleteCouldOutrank = sourceCodes.some((source) => {
    const state = input[source].state;
    return (
      (state === "stale" || state === "unavailable") &&
      PRIORITY_SOURCE_REGISTRY[source].highestBand <= selectedBand
    );
  });
  if (incompleteCouldOutrank)
    return Object.freeze({
      kind: "unconfirmed",
      safeReason: "required_source_unavailable",
      policyVersion: PRIORITY_POLICY_VERSION,
    });
  if (!selected) return Object.freeze({ kind: "none", policyVersion: PRIORITY_POLICY_VERSION });
  return Object.freeze({
    kind: "action",
    action: Object.freeze({ ...selected }),
    policyVersion: PRIORITY_POLICY_VERSION,
  });
}
