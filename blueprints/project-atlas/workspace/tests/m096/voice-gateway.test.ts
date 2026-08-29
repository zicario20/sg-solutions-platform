import { describe, expect, it } from "vitest";

import {
  createVoiceGatewayDefinition,
  createVoiceWorkloadPack,
  registerVoiceProviderProfile,
  requestVoiceCallSession,
  requestVoiceTransfer,
  resolveVoiceCaptureControl,
} from "../../packages/voice-gateway/src/index";

describe("M096 voice gateway controlled foundation", () => {
  it("does not connect a call, authenticate a caller, or grant business context", () => {
    const gateway = createVoiceGatewayDefinition({
      permission: "voice.gateway.configure",
      code: "VOICE_GATEWAY_PRIMARY",
      nodeReference: "VOICE_NODE_PRIMARY",
    });
    const session = requestVoiceCallSession({
      permission: "voice.gateway.call.request",
      code: "VOICE_CALL_REQUEST_001",
      gateway,
      direction: "inbound",
      callerReference: "CONTACT_REFERENCE_SAFE",
    });

    expect(session.status).toBe("blocked_runtime_disabled");
    expect(session.connected).toBe(false);
    expect(session.callerAuthenticated).toBe(false);
    expect(session.businessContextGranted).toBe(false);
  });

  it("fails closed for unresolved recording consent and rejects raw credentials", () => {
    const gateway = createVoiceGatewayDefinition({
      permission: "voice.gateway.configure",
      code: "VOICE_GATEWAY_CAPTURE",
      nodeReference: "VOICE_NODE_CAPTURE",
    });
    const session = requestVoiceCallSession({
      permission: "voice.gateway.call.request",
      code: "VOICE_CALL_REQUEST_002",
      gateway,
      direction: "test",
    });
    const capture = resolveVoiceCaptureControl({
      permission: "voice.gateway.capture.review",
      code: "VOICE_CAPTURE_CONTROL_001",
      sessionRequest: session,
      consentState: "unknown",
    });

    expect(capture.status).toBe("review_required");
    expect(capture.recordingAllowed).toBe(false);
    expect(capture.transcriptionAllowed).toBe(false);
    expect(() =>
      registerVoiceProviderProfile({
        permission: "voice.gateway.provider.register",
        code: "UNSAFE_VOICE_PROVIDER",
        gateway,
        providerType: "sip_trunk",
        credentialMaterial: "Bearer super-secret-token",
      }),
    ).toThrow("cannot contain raw credential material");
  });

  it("does not invoke workload agents or complete transfers", () => {
    const gateway = createVoiceGatewayDefinition({
      permission: "voice.gateway.configure",
      code: "VOICE_GATEWAY_HANDOFF",
      nodeReference: "VOICE_NODE_HANDOFF",
    });
    const session = requestVoiceCallSession({
      permission: "voice.gateway.call.request",
      code: "VOICE_CALL_REQUEST_003",
      gateway,
      direction: "transfer",
    });
    const workload = createVoiceWorkloadPack({
      permission: "voice.gateway.route.manage",
      code: "VOICE_RECEPTION_PACK",
      ownerModuleReference: "M049",
      localeSupport: ["es", "en"],
    });
    const transfer = requestVoiceTransfer({
      permission: "voice.gateway.transfer.request",
      code: "VOICE_TRANSFER_001",
      sessionRequest: session,
      transferType: "agent_to_human",
      targetReference: "HUMAN_QUEUE_PRIMARY",
    });

    expect(workload.agentRuntimeInvoked).toBe(false);
    expect(workload.unrestrictedContextGranted).toBe(false);
    expect(transfer.status).toBe("blocked_runtime_disabled");
    expect(transfer.targetLegVerified).toBe(false);
  });
});
