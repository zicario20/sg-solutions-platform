import {
  RECEPTION_PROHIBITED_TOOLS,
  type ReceptionTool,
  type ReceptionToolRequestName,
} from "./contracts.js";

export interface ReceptionToolDecision {
  readonly status: "prepared";
  readonly tool: ReceptionTool;
  readonly executionPermitted: false;
}

function isProhibitedReceptionTool(
  tool: ReceptionToolRequestName,
): tool is (typeof RECEPTION_PROHIBITED_TOOLS)[number] {
  return (RECEPTION_PROHIBITED_TOOLS as readonly string[]).includes(tool);
}

export function validateReceptionToolRequest(input: {
  readonly tool: ReceptionToolRequestName;
  readonly executionRequested: boolean;
  readonly authenticated: boolean;
}): ReceptionToolDecision {
  if (isProhibitedReceptionTool(input.tool))
    throw new TypeError("reception tool is prohibited");
  if (input.executionRequested) throw new TypeError("reception tool execution is not allowed");
  if (input.tool === "prepare_authenticated_support_handoff" && !input.authenticated)
    throw new TypeError("authentication is required for authenticated support handoff");
  return Object.freeze({
    status: "prepared" as const,
    tool: input.tool,
    executionPermitted: false as const,
  });
}
