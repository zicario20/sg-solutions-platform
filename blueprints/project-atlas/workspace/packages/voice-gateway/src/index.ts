export const VOICE_GATEWAY_MODULE = "M096" as const;

export const VOICE_GATEWAY_PERMISSIONS = [
  "voice.gateway.configure",
  "voice.gateway.provider.register",
  "voice.gateway.number.manage",
  "voice.gateway.route.manage",
  "voice.gateway.call.request",
  "voice.gateway.transfer.request",
  "voice.gateway.capture.review",
  "voice.gateway.runtime.activate",
] as const;

export type VoiceGatewayPermission = (typeof VOICE_GATEWAY_PERMISSIONS)[number];

export const VOICE_GATEWAY_RUNTIME = {
  providerConnections: false,
  numberProvisioning: false,
  signaling: false,
  mediaTransport: false,
  inboundCalls: false,
  outboundCalls: false,
  stt: false,
  tts: false,
  recording: false,
  transcription: false,
  transfers: false,
  workloadHandoffs: false,
  providerFailover: false,
  telemetry: false,
} as const;

export type VoiceGatewayStatus =
  | "draft"
  | "review_required"
  | "blocked_runtime_disabled"
  | "not_ready";

export type VoiceProviderType =
  | "managed_cloud_voice"
  | "sip_trunk"
  | "pstn_carrier"
  | "webrtc_gateway"
  | "internal_sip"
  | "test_emulator";

export type VoiceCallDirection = "inbound" | "outbound" | "internal" | "transfer" | "callback" | "test";

export type VoiceConsentState = "granted" | "denied" | "unknown" | "not_required";

export interface VoiceGatewayDefinition {
  readonly module: typeof VOICE_GATEWAY_MODULE;
  readonly code: string;
  readonly nodeReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly listenerBound: false;
  readonly providerRegistered: false;
  readonly mediaReady: false;
  readonly businessAuthorityGranted: false;
}

export interface VoiceProviderProfile {
  readonly code: string;
  readonly gatewayCode: string;
  readonly providerType: VoiceProviderType;
  readonly status: "draft";
  readonly credentialsLoaded: false;
  readonly providerConnected: false;
  readonly trustedForCallControl: false;
}

export interface VoiceCallSessionRequest {
  readonly code: string;
  readonly gatewayCode: string;
  readonly direction: VoiceCallDirection;
  readonly status: "blocked_runtime_disabled";
  readonly connected: false;
  readonly mediaActive: false;
  readonly callerAuthenticated: false;
  readonly businessContextGranted: false;
}

export interface VoiceCaptureControl {
  readonly code: string;
  readonly sessionRequestCode: string;
  readonly consentState: VoiceConsentState;
  readonly status: "blocked_runtime_disabled" | "review_required";
  readonly recordingAllowed: false;
  readonly transcriptionAllowed: false;
  readonly rawAudioStored: false;
  readonly transcriptStored: false;
}

export interface VoiceWorkloadPack {
  readonly code: string;
  readonly ownerModuleReference: string;
  readonly localeSupport: readonly ("es" | "en")[];
  readonly status: "draft";
  readonly agentRuntimeInvoked: false;
  readonly businessAuthorityGranted: false;
  readonly unrestrictedContextGranted: false;
}

export interface VoiceTransferRequest {
  readonly code: string;
  readonly sessionRequestCode: string;
  readonly transferType: "agent_to_human" | "agent_to_specialist" | "provider_blind" | "provider_warm" | "callback_handoff";
  readonly status: "blocked_runtime_disabled";
  readonly initiated: false;
  readonly targetLegVerified: false;
  readonly contextExpanded: false;
}

export interface VoiceGatewayReadinessResult {
  readonly gatewayCode: string;
  readonly status: "not_ready";
  readonly ready: false;
  readonly reasons: readonly string[];
}

function requireIdentifier(value: string, field: string): void {
  if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) {
    throw new Error(`${field} must be a stable safe identifier.`);
  }
}

function requirePermission(permission: VoiceGatewayPermission): void {
  if (!VOICE_GATEWAY_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported voice gateway permission: ${permission}.`);
  }
}

function rejectRestrictedMaterial(value: string | undefined, field: string): void {
  if (
    value !== undefined &&
    /(secret|password|token|api[_-]?key|authorization:|bearer\s|-----begin|eyj[a-z0-9_-]{10,})/iu.test(value)
  ) {
    throw new Error(`${field} cannot contain raw credential material.`);
  }
}

export function createVoiceGatewayDefinition(input: {
  readonly permission: VoiceGatewayPermission;
  readonly code: string;
  readonly nodeReference: string;
  readonly includesEndpointOrCredential?: string;
}): VoiceGatewayDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Voice gateway code");
  requireIdentifier(input.nodeReference, "Voice gateway node reference");
  rejectRestrictedMaterial(input.includesEndpointOrCredential, "Voice gateway definition");

  return {
    module: VOICE_GATEWAY_MODULE,
    code: input.code,
    nodeReference: input.nodeReference,
    status: "draft",
    active: false,
    listenerBound: false,
    providerRegistered: false,
    mediaReady: false,
    businessAuthorityGranted: false,
  };
}

export function registerVoiceProviderProfile(input: {
  readonly permission: VoiceGatewayPermission;
  readonly code: string;
  readonly gateway: VoiceGatewayDefinition;
  readonly providerType: VoiceProviderType;
  readonly credentialMaterial?: string;
}): VoiceProviderProfile {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Voice provider code");
  rejectRestrictedMaterial(input.credentialMaterial, "Voice provider registration");

  return {
    code: input.code,
    gatewayCode: input.gateway.code,
    providerType: input.providerType,
    status: "draft",
    credentialsLoaded: false,
    providerConnected: false,
    trustedForCallControl: false,
  };
}

export function requestVoiceCallSession(input: {
  readonly permission: VoiceGatewayPermission;
  readonly code: string;
  readonly gateway: VoiceGatewayDefinition;
  readonly direction: VoiceCallDirection;
  readonly callerReference?: string;
  readonly callerIdOrAudio?: string;
}): VoiceCallSessionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Voice call session request code");
  rejectRestrictedMaterial(input.callerIdOrAudio, "Voice call session request");
  if (input.callerReference !== undefined) requireIdentifier(input.callerReference, "Caller reference");

  return {
    code: input.code,
    gatewayCode: input.gateway.code,
    direction: input.direction,
    status: "blocked_runtime_disabled",
    connected: false,
    mediaActive: false,
    callerAuthenticated: false,
    businessContextGranted: false,
  };
}

export function resolveVoiceCaptureControl(input: {
  readonly permission: VoiceGatewayPermission;
  readonly code: string;
  readonly sessionRequest: VoiceCallSessionRequest;
  readonly consentState: VoiceConsentState;
}): VoiceCaptureControl {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Voice capture control code");

  return {
    code: input.code,
    sessionRequestCode: input.sessionRequest.code,
    consentState: input.consentState,
    status: input.consentState === "unknown" ? "review_required" : "blocked_runtime_disabled",
    recordingAllowed: false,
    transcriptionAllowed: false,
    rawAudioStored: false,
    transcriptStored: false,
  };
}

export function createVoiceWorkloadPack(input: {
  readonly permission: VoiceGatewayPermission;
  readonly code: string;
  readonly ownerModuleReference: string;
  readonly localeSupport: readonly ("es" | "en")[];
}): VoiceWorkloadPack {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Voice workload pack code");
  requireIdentifier(input.ownerModuleReference, "Voice workload owner module reference");
  if (input.localeSupport.length === 0) throw new Error("Voice workload packs require locale support.");

  return {
    code: input.code,
    ownerModuleReference: input.ownerModuleReference,
    localeSupport: [...new Set(input.localeSupport)],
    status: "draft",
    agentRuntimeInvoked: false,
    businessAuthorityGranted: false,
    unrestrictedContextGranted: false,
  };
}

export function requestVoiceTransfer(input: {
  readonly permission: VoiceGatewayPermission;
  readonly code: string;
  readonly sessionRequest: VoiceCallSessionRequest;
  readonly transferType: VoiceTransferRequest["transferType"];
  readonly targetReference: string;
}): VoiceTransferRequest {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Voice transfer request code");
  requireIdentifier(input.targetReference, "Voice transfer target reference");

  return {
    code: input.code,
    sessionRequestCode: input.sessionRequest.code,
    transferType: input.transferType,
    status: "blocked_runtime_disabled",
    initiated: false,
    targetLegVerified: false,
    contextExpanded: false,
  };
}

export function evaluateVoiceGatewayReadiness(input: {
  readonly gateway: VoiceGatewayDefinition;
  readonly provider: VoiceProviderProfile;
}): VoiceGatewayReadinessResult {
  const reasons = [
    "voice_runtime_disabled",
    "provider_not_connected",
    "signaling_not_verified",
    "media_path_not_verified",
    "capture_policy_not_operational",
  ];
  if (input.gateway.code !== input.provider.gatewayCode) reasons.push("provider_gateway_mismatch");

  return {
    gatewayCode: input.gateway.code,
    status: "not_ready",
    ready: false,
    reasons,
  };
}
