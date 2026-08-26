import type { ClientServiceCardDto, ClientServiceRootProjection } from "@atlas/client-services";
export const M009_TEST_NOW = new Date("2026-08-21T15:00:00.000Z"),
  M009_REF = "csr1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
export const syntheticM009Snapshot = {
  schemaVersion: "m008.auth.v2",
  accountId: "test-account",
  sessionId: "s",
  sessionFamilyId: "f",
  userId: "u",
  accountStatus: "active",
  sessionStatus: "active",
  sessionExpiresAt: "2026-08-22T00:00:00Z",
  assurance: "aal1",
  authenticationEpoch: "1",
  authorizationEpoch: "4",
  policyEpoch: "5",
  context: { type: "organization", opaqueRef: "test-context" },
  contextOptions: [{ type: "organization", opaqueRef: "test-context", label: "Test Org" }],
  membershipFence: "m",
  resourceGrantFence: "r",
  entitlementFence: "e",
  policyVersion: "m009",
  locale: "en",
  capturedAt: M009_TEST_NOW,
} as const;
const axisLabels = {
  commercial: { active: "Active" },
  financial: { paid: "Paid" },
  activation: { approved: "Approved" },
  fulfillment: { in_progress: "In progress" },
};
const display = {
  contextLabel: "Test Org",
  serviceName: "Accepted service",
  categoryLabel: "Advisory",
  scopeLabel: "Accepted scope",
  publicStateLabels: { in_progress: "In progress", unconfirmed: "Unconfirmed" },
  axisLabels,
  nextStepLabel: "Review request",
  milestones: [{ label: "Started", stateLabel: "Complete" }],
};
export function syntheticM009Root(
  overrides: Partial<ClientServiceRootProjection> = {},
): ClientServiceRootProjection {
  return {
    serviceOrderId: "test-order",
    ownerAccountId: "test-account",
    ownerContextOpaqueRef: "test-context",
    resourceEpoch: 7,
    acceptedDefinitionVersionId: "definition-v1",
    acceptedDefinitionEpoch: 2,
    opaqueRef: M009_REF,
    publicReference: "TEST-1",
    contextType: "organization",
    axes: {
      commercial: "active",
      financial: "paid",
      activation: "approved",
      fulfillment: "in_progress",
    },
    ownerFacts: {
      financial: { sourceVersion: "financial.v1", resourceEpoch: 1 },
      activation: { sourceVersion: "activation.v1", resourceEpoch: 1 },
      fulfillment: { sourceVersion: "fulfillment.v1", resourceEpoch: 1 },
    },
    displays: { es: display, en: display },
    currentMilestoneIndex: 0,
    completedMilestones: 1,
    criticalSources: { tasks: "fresh", documents: "fresh", payments: "fresh" },
    updatedAt: M009_TEST_NOW,
    grant: {
      permission: "client.service.read",
      state: "active",
      accountId: "test-account",
      contextOpaqueRef: "test-context",
      authorizationEpoch: 4,
      policyEpoch: 5,
      resourceEpoch: 7,
      expiresAt: "2026-08-22T00:00:00Z",
    },
    ...overrides,
  };
}
export function syntheticM009Card(
  overrides: Partial<ClientServiceCardDto> = {},
): ClientServiceCardDto {
  return {
    opaqueRef: M009_REF,
    publicReference: "TEST-1",
    context: { type: "organization", label: "Test Org" },
    serviceName: "Accepted service",
    categoryLabel: "Advisory",
    publicState: "in_progress",
    publicStateLabel: "In progress",
    axes: {
      commercial: "active",
      financial: "paid",
      activation: "approved",
      fulfillment: "in_progress",
    },
    axisLabels: {
      commercial: "Active",
      financial: "Paid",
      activation: "Approved",
      fulfillment: "In progress",
    },
    currentMilestone: { label: "Started", stateLabel: "Complete" },
    milestones: { completed: 1, total: 1 },
    nextStepLabel: "Review request",
    updatedAt: M009_TEST_NOW.toISOString(),
    ...overrides,
  };
}
