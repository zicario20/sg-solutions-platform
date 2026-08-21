import { createInterface } from "node:readline";
import {
  MemoryVoiceCommandReceiptRepository,
  MemoryVoiceLifecycleRepository,
} from "../../../packages/database/src/index.ts";
import { VoiceOperationsFacade } from "../../../apps/app/src/lib/voice/operations-facade.ts";
import { createFailClosedOwnerPorts } from "../../../apps/app/src/lib/voice/owner-ports.ts";
import {
  BoundedMemoryVoiceCredentialRepository,
  VoiceServiceAuthenticator,
} from "../../../apps/app/src/lib/voice/service-auth.ts";
import { SyntheticVoicePlatform } from "../../../apps/app/src/lib/voice/synthetic-platform.ts";

const secret = Buffer.from(
  "m005-composed-platform-secret-000000000000000000000000000000",
);
const reconciled = new Map<string, {
  receiptId: string;
  outcome: "transfer_requested";
}>();
const owners = {
  ...createFailClosedOwnerPorts(),
  requestTransfer: async (input: { idempotencyKey: string }) => {
    const receipt = {
      receiptId: "synthetic_transfer_receipt_001",
      outcome: "transfer_requested" as const,
    };
    reconciled.set(input.idempotencyKey, receipt);
    return receipt;
  },
  reconcileCommand: async (input: { idempotencyKey: string }) => {
    const receipt = reconciled.get(input.idempotencyKey);
    return receipt
      ? { status: "completed" as const, receipt }
      : { status: "unknown" as const };
  },
};
const lifecycle = new MemoryVoiceLifecycleRepository();
const credentials = new BoundedMemoryVoiceCredentialRepository({ capacity: 128 });
const facade = new VoiceOperationsFacade({
  authenticator: new VoiceServiceAuthenticator(
    secret,
    credentials,
    { allowBoundedTestRepository: true },
  ),
  receipts: new MemoryVoiceCommandReceiptRepository(),
  owners,
});
const platform = new SyntheticVoicePlatform({
  facade,
  lifecycle,
  serviceSecret: secret,
  credentials,
  allowBoundedTestRepository: true,
});

function write(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of input) {
  try {
    if (Buffer.byteLength(line, "utf8") > 131_072) {
      throw new Error("SYNTHETIC_MESSAGE_TOO_LARGE");
    }
    const message = JSON.parse(line) as Record<string, unknown>;
    if (message.type === "start_call") {
      write({ ok: true, receiptId: await platform.startCall(message.call) });
    } else if (message.type === "issue_ticket") {
      write({ ok: true, credential: await platform.issueTicket(message.command) });
    } else if (message.type === "execute") {
      write({
        ok: true,
        result: await platform.execute(message.command, message.credential),
      });
    } else if (message.type === "snapshot" && typeof message.callId === "string") {
      write({ ok: true, snapshot: await platform.snapshot(message.callId) });
    } else if (message.type === "close") {
      write({ ok: true });
      input.close();
      break;
    } else {
      throw new Error("SYNTHETIC_MESSAGE_INVALID");
    }
  } catch (error) {
    write({
      ok: false,
      code: error instanceof Error ? error.message : "SYNTHETIC_FAILURE",
    });
  }
}
