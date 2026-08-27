import { M050_CANONICAL_BOUNDARIES, M050_PROHIBITED_ACTIONS } from "./policy.js";

export const M050_GOVERNANCE_CONTRACT = {
  canonicalBoundaries: M050_CANONICAL_BOUNDARIES,
  dataStorage: "references_and_snapshots_only_until_authorized_secure_runtime",
  decisions: "intake_completion_and_readiness_only",
  forbiddenActions: M050_PROHIBITED_ACTIONS,
  handoff: "prepared_scoped_package_without_dispatch",
  providerStatus: "disabled",
  versioning: "published_definitions_and_submissions_are_immutable",
} as const;
