import type { DashboardPriorityInput } from "@atlas/dashboard";
import type {
  ProcessFactKind,
  ProcessSourceCode,
  ProcessSourceDefinition,
  ProcessSourceRegistry,
} from "./ports.ts";
import type { ProcessEventMapping } from "./timeline-policy.ts";

const allowed = new Set<ProcessSourceCode>([
  "workflow",
  "tasks",
  "documents",
  "payments",
  "appointments",
  "messages",
  "dependencies",
  "help",
  "deliverables",
  "timeline",
]);
export const REQUIRED_PROCESS_SOURCE_CODES = Object.freeze([
  "workflow",
  "tasks",
  "documents",
  "payments",
] as const);
const required = new Set<ProcessSourceCode>(REQUIRED_PROCESS_SOURCE_CODES);
export const PROCESS_SOURCE_CAPABILITIES: Readonly<
  Record<
    ProcessSourceCode,
    {
      facts: readonly ProcessFactKind[];
      priority: readonly (keyof DashboardPriorityInput)[];
      blockers: boolean;
    }
  >
> = Object.freeze({
  workflow: { facts: ["milestones", "blockers"], priority: ["services"], blockers: true },
  tasks: { facts: ["items", "blockers", "priority"], priority: ["tasks"], blockers: true },
  documents: { facts: ["items", "blockers", "priority"], priority: ["documents"], blockers: true },
  payments: { facts: ["items", "blockers", "priority"], priority: ["payments"], blockers: true },
  appointments: { facts: ["items", "priority"], priority: ["appointments"], blockers: false },
  messages: { facts: ["items"], priority: [], blockers: false },
  dependencies: { facts: ["items", "blockers"], priority: [], blockers: true },
  help: { facts: ["items"], priority: [], blockers: false },
  deliverables: { facts: ["items"], priority: [], blockers: false },
  timeline: { facts: ["events"], priority: [], blockers: false },
});
export function createProcessSourceRegistry(
  entries: readonly ProcessSourceDefinition[] = [],
  policy: {
    version: string;
    mappingPolicyVersion: string;
    acceptedDefinitionVersions: readonly string[];
    acceptedWorkflowVersions: readonly string[];
    eventMappings?: readonly ProcessEventMapping[];
  } = {
    version: "m010.sources.disabled.v1",
    mappingPolicyVersion: "m010.timeline.disabled.v1",
    acceptedDefinitionVersions: [],
    acceptedWorkflowVersions: [],
  },
): ProcessSourceRegistry {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (
      !allowed.has(entry.code) ||
      seen.has(entry.code) ||
      !entry.ownerVersion?.trim() ||
      !Number.isSafeInteger(entry.freshnessMs) ||
      entry.freshnessMs <= 0 ||
      !Number.isInteger(entry.highestPriorityBand) ||
      entry.highestPriorityBand < 1 ||
      entry.highestPriorityBand > 7 ||
      (required.has(entry.code) && entry.critical !== true)
    )
      throw new TypeError("PROCESS_SOURCE_REGISTRY_INVALID");
    seen.add(entry.code);
  }
  if (
    entries.length &&
    (REQUIRED_PROCESS_SOURCE_CODES.some((code) => !seen.has(code)) ||
      !policy.version.trim() ||
      !policy.mappingPolicyVersion.trim() ||
      !policy.acceptedDefinitionVersions.length ||
      !policy.acceptedWorkflowVersions.length)
  )
    throw new TypeError("PROCESS_SOURCE_REGISTRY_INCOMPLETE");
  const ids = new Set<string>();
  for (const mapping of policy.eventMappings ?? []) {
    if (!mapping.mappingId?.trim() || ids.has(mapping.mappingId))
      throw new TypeError("PROCESS_EVENT_MAPPING_INVALID");
    ids.add(mapping.mappingId);
  }
  return Object.freeze({
    version: policy.version,
    mappingPolicyVersion: policy.mappingPolicyVersion,
    acceptedDefinitionVersions: Object.freeze([...policy.acceptedDefinitionVersions]),
    acceptedWorkflowVersions: Object.freeze([...policy.acceptedWorkflowVersions]),
    entries: Object.freeze([...entries]),
    eventMappings: Object.freeze([...(policy.eventMappings ?? [])]),
  });
}
export const EMPTY_PROCESS_SOURCE_REGISTRY = createProcessSourceRegistry();
