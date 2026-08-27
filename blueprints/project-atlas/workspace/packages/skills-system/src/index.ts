export type SkillRiskClass = "low" | "moderate" | "high" | "restricted";
export type SkillExecutionClass = "read_only" | "candidate_write" | "external_effect";
export interface SkillsSystemActorContext {
  actorId: string;
  identityAssurance: "verified" | "unverified";
  skillsAuthorization: "valid" | "missing" | "expired";
  purposeAuthorization: "valid" | "missing" | "expired";
}
export interface SkillDefinitionInput {
  code: string;
  name: string;
  category: string;
  ownerReference: string;
  riskClass: SkillRiskClass;
  executionClass: SkillExecutionClass;
  declaredCapabilities: readonly string[];
  inputSchemaReference: string;
  outputSchemaReference: string;
}
export interface SkillDefinition extends SkillDefinitionInput {
  id: string;
  status: "registered";
  enabled: false;
}
export interface SkillVersionInput {
  definition: SkillDefinition;
  version: string;
  manifestReference: string;
  manifestDigest: string;
  dependencyCodes: readonly string[];
}
export interface SkillVersion extends SkillVersionInput {
  id: string;
  status: "draft";
  immutableWhenPublished: true;
}
export interface SkillBindingInput {
  actor: SkillsSystemActorContext;
  agentManifestReference: string;
  skillVersion: SkillVersion;
  allowedCapabilities: readonly string[];
}
export interface SkillBinding extends SkillBindingInput {
  id: string;
  status: "bound_disabled";
}
export interface SkillAuthorityIntersection {
  actorScopes: readonly string[];
  agentCapabilities: readonly string[];
  skillCapabilities: readonly string[];
  toolAllowlist: readonly string[];
  resourcePermissions: readonly string[];
  consentStatus: "not_required" | "valid" | "missing" | "revoked";
  entitlementStatus: "not_required" | "valid" | "missing" | "expired";
  approvalStatus: "not_required" | "valid" | "missing" | "expired";
  environmentStatus: "allowed" | "blocked";
}
export interface SkillInvocationRequest {
  binding: SkillBinding;
  correlationId: string;
  requestedCapability: string;
  contextReferences: readonly string[];
  authority: SkillAuthorityIntersection;
}
export interface SkillInvocationDecision {
  id: string;
  status: "blocked" | "review_required";
  reasonCode: "AUTHORITY_INTERSECTION_DENIED" | "SKILLS_RUNTIME_DISABLED";
  capabilityGranted: false;
  dispatched: false;
  externalEffectAuthorized: false;
}

export const skillsSystemRuntimePolicy = {
  modelInvocationEnabled: false,
  toolExecutionEnabled: false,
  workflowDispatchEnabled: false,
  jobDispatchEnabled: false,
  externalWritesEnabled: false,
  personalizedCacheEnabled: false,
  fallbackRoutingEnabled: false,
  canonicalWriteEnabled: false
} as const;
export const skillsSystemProhibitedActions = [
  "expand_actor_authority",
  "execute_tools",
  "publish_skill_versions",
  "bypass_consent_or_entitlement",
  "bypass_approval",
  "write_canonical_domain_facts",
  "dispatch_external_effects"
] as const;

const ref = (kind: string, value: string) => kind + ":" + value;
export const isSkillsSystemRuntimeEnabled = (): false => false;
export function assertSkillsSystemActor(actor: SkillsSystemActorContext): void {
  if (actor.identityAssurance !== "verified") throw new Error("SKILLS_SYSTEM_VERIFIED_IDENTITY_REQUIRED");
  if (actor.skillsAuthorization !== "valid") throw new Error("SKILLS_SYSTEM_AUTHORIZATION_REQUIRED");
  if (actor.purposeAuthorization !== "valid") throw new Error("SKILLS_SYSTEM_PURPOSE_AUTHORIZATION_REQUIRED");
}
export function assertSkillCode(code: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,}$/.test(code)) throw new Error("SKILLS_SYSTEM_INVALID_STABLE_CODE");
}
export function assertAcyclicSkillDependencies(rootCode: string, dependencyCodes: readonly string[]): void {
  if (dependencyCodes.includes(rootCode)) throw new Error("SKILLS_SYSTEM_CIRCULAR_DEPENDENCY");
}
export function authorityIntersectionAllows(capability: string, authority: SkillAuthorityIntersection): boolean {
  return [authority.actorScopes, authority.agentCapabilities, authority.skillCapabilities, authority.toolAllowlist, authority.resourcePermissions]
    .every((list) => list.includes(capability))
    && !["missing", "revoked"].includes(authority.consentStatus)
    && !["missing", "expired"].includes(authority.entitlementStatus)
    && !["missing", "expired"].includes(authority.approvalStatus)
    && authority.environmentStatus === "allowed";
}
export function registerSkillDefinition(input: SkillDefinitionInput): SkillDefinition {
  assertSkillCode(input.code);
  return { ...input, id: ref("skill-definition", input.code), status: "registered", enabled: false };
}
export function createDraftSkillVersion(input: SkillVersionInput): SkillVersion {
  assertAcyclicSkillDependencies(input.definition.code, input.dependencyCodes);
  return { ...input, id: ref("skill-version", input.definition.code + ":" + input.version), status: "draft", immutableWhenPublished: true };
}
export function bindSkillVersion(input: SkillBindingInput): SkillBinding {
  assertSkillsSystemActor(input.actor);
  return { ...input, id: ref("skill-binding", input.agentManifestReference + ":" + input.skillVersion.id), status: "bound_disabled" };
}
export function evaluateSkillInvocation(input: SkillInvocationRequest): SkillInvocationDecision {
  const authorityAllowed = authorityIntersectionAllows(input.requestedCapability, input.authority);
  return {
    id: ref("skill-invocation", input.correlationId),
    status: authorityAllowed ? "review_required" : "blocked",
    reasonCode: authorityAllowed ? "SKILLS_RUNTIME_DISABLED" : "AUTHORITY_INTERSECTION_DENIED",
    capabilityGranted: false,
    dispatched: false,
    externalEffectAuthorized: false
  };
}
export function getSkillsSystemRuntimeStatus() {
  return { enabled: false as const, policy: skillsSystemRuntimePolicy, activationRequires: ["M047_control_plane_binding", "immutable_release_and_audit_controls", "tool_and_resource_policy_enforcement", "Product Owner authorization"] as const };
}
