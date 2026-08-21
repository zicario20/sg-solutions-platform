import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createVoiceCorrelationId,
  recordVoiceTelemetry,
} from "@atlas/observability";
import { MemoryVoiceCommandReceiptRepository } from "../../packages/database/src/voice-command-repository.ts";
import type { VoiceCommand } from "../../packages/domain/src/voice/index.ts";
import { VoiceOperationsFacade } from "../../apps/app/src/lib/voice/operations-facade.ts";
import { createFailClosedOwnerPorts } from "../../apps/app/src/lib/voice/owner-ports.ts";
import { recoverVoiceCall } from "../../apps/app/src/lib/voice/recovery-jobs.ts";
import {
  issueVoiceServiceCredential,
  BoundedMemoryVoiceCredentialRepository,
  VoiceServiceAuthenticator,
} from "../../apps/app/src/lib/voice/service-auth.ts";

const now = new Date("2026-08-20T12:00:00.000Z");
const secret = Buffer.from("m005-integration-secret-000000000000000000000000000000000");

function setup() {
  let nonce = 0;
  let leadCalls = 0;
  let callbackCalls = 0;
  const observedLocales: string[] = [];
  const facade = new VoiceOperationsFacade({
    authenticator: new VoiceServiceAuthenticator(
      secret,
      new BoundedMemoryVoiceCredentialRepository({ capacity: 128 }),
      { allowBoundedTestRepository: true },
    ),
    receipts: new MemoryVoiceCommandReceiptRepository(),
    owners: {
      ...createFailClosedOwnerPorts(),
      createLead: async (input) => {
        leadCalls += 1;
        observedLocales.push(input.locale);
        return {
          receiptId: `lead_receipt_${input.locale}_001`,
          outcome: "lead_created",
        };
      },
      requestCallback: async () => {
        callbackCalls += 1;
        return {
          receiptId: "callback_receipt_integration_001",
          outcome: "callback_requested",
        };
      },
    },
  });
  const credentialFor = (command: VoiceCommand) => {
    nonce += 1;
    return {
      now,
      credential: issueVoiceServiceCredential(
        {
          callId: command.callId,
          commandId: command.commandId,
          idempotencyKey: command.idempotencyKey,
          operation: command.operation,
          nonce: `voice_integration_nonce_${String(nonce).padStart(8, "0")}`,
          issuedAt: new Date(now.getTime() - 1_000),
          expiresAt: new Date(now.getTime() + 60_000),
        },
        secret,
      ),
    };
  };
  return {
    facade,
    credentialFor,
    observedLocales,
    leadCalls: () => leadCalls,
    callbackCalls: () => callbackCalls,
  };
}

function command(
  locale: "es" | "en",
  operation: VoiceCommand["operation"],
  suffix: string,
): VoiceCommand {
  return {
    commandId: `voice_command_${suffix}`,
    callId: `voice_call_${suffix}`,
    idempotencyKey: `voice_idempotency_${suffix}`,
    operation,
    locale,
    correlationId: `voice_correlation_${suffix}`,
    requestedAt: now,
    confirmed: true,
  };
}

describe("M005 provider-disabled synthetic journeys", () => {
  it("creates authoritative bilingual lead receipts in mock mode", async () => {
    const runtime = setup();
    const outcomes = [];
    for (const [locale, suffix] of [
      ["es", "lead_es"],
      ["en", "lead_en"],
    ] as const) {
      const input = command(locale, "create_lead", suffix);
      const result = await runtime.facade.execute(input, runtime.credentialFor(input));
      outcomes.push({ ...result, providerMode: "mock" });
    }
    expect(outcomes).toEqual([
      {
        kind: "completed",
        outcome: "lead_created",
        receiptId: "lead_receipt_es_001",
        providerMode: "mock",
      },
      {
        kind: "completed",
        outcome: "lead_created",
        receiptId: "lead_receipt_en_001",
        providerMode: "mock",
      },
    ]);
    expect(runtime.observedLocales).toEqual(["es", "en"]);
    expect(runtime.leadCalls()).toBe(2);
  });

  it("denies personalized status without platform verification", async () => {
    const runtime = setup();
    const input = command("en", "safe_status", "status_denied");
    await expect(
      runtime.facade.execute(input, runtime.credentialFor(input)),
    ).resolves.toEqual({ kind: "verification_required" });
  });

  it("rejects external provider admission in the real Python proof boundary", () => {
    const gateway = fileURLToPath(
      new URL("../../services/voice-gateway/", import.meta.url),
    );
    const script = [
      "from app.security.provider_proof import ProviderProofVerifier, ProviderRequest",
      "v=ProviderProofVerifier(secret=b'x'*32, connections={})",
      "r=v.verify(ProviderRequest('INVALID',None,None,'','','','','','',b'not-json'))",
      "print(r.code)",
    ].join("; ");
    const output = execFileSync("python", ["-c", script], {
      cwd: gateway,
      encoding: "utf8",
    }).trim();
    expect(output).toBe("provider_disabled");
  });

  it("composes authenticated Python admission through the TypeScript durable owner", () => {
    const gateway = fileURLToPath(
      new URL("../../services/voice-gateway/", import.meta.url),
    );
    const script = [
      "from tests.test_synthetic_composition import test_default_synthetic_admission_is_disabled as disabled",
      "from tests.test_synthetic_composition import test_authenticated_composition_persists_handoff_in_typescript as composed",
      "disabled()",
      "composed()",
      "print('2 composed synthetic tests passed')",
    ].join("; ");
    const output = execFileSync("python", ["-c", script], {
      cwd: gateway,
      encoding: "utf8",
    }).trim();
    expect(output).toBe("2 composed synthetic tests passed");
  });

  it("replays a confirmed callback without duplicating owner work", async () => {
    const runtime = setup();
    const recovery = {
      callId: "voice_call_recovery_integration",
      correlationId: "voice_correlation_recovery_integration",
      reason: "media_unavailable",
      locale: "en",
      fallback: "callback",
      callerConfirmed: true,
      now,
      facade: runtime.facade,
      credentialFor: runtime.credentialFor,
    } as const;
    const first = await recoverVoiceCall(recovery);
    const replay = await recoverVoiceCall(recovery);
    expect(first).toMatchObject({ outcome: "callback_requested" });
    expect(replay).toEqual(first);
    expect(runtime.callbackCalls()).toBe(1);
  });

  it("exports only closed metadata telemetry and rejects caller data", () => {
    const correlationId = createVoiceCorrelationId();
    const telemetry = recordVoiceTelemetry({
      operation: "facade_command",
      outcome: "completed",
      correlationId,
      locale: "es",
      durationBucket: "under_500ms",
      redactionMarker: "metadata_only",
    });
    expect(JSON.stringify(telemetry)).not.toContain("+15555550123");
    expect(Object.keys(telemetry).sort()).toEqual(
      [
        "operation",
        "outcome",
        "correlationId",
        "locale",
        "durationBucket",
        "redactionMarker",
      ].sort(),
    );
    expect(() =>
      recordVoiceTelemetry({
        operation: "facade_command",
        outcome: "completed",
        correlationId,
        locale: "es",
        durationBucket: "under_500ms",
        redactionMarker: "metadata_only",
        callerPhone: "+15555550123",
      }),
    ).toThrow("VOICE_TELEMETRY_INVALID");
  });
});
