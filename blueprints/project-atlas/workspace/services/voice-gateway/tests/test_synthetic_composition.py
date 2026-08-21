from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime
import json
from pathlib import Path
import shutil
import subprocess
from typing import Any

from app.composition.synthetic import (
    SyntheticCallStart,
    SyntheticVoiceComposition,
    default_synthetic_verifier,
)
from app.security.provider_proof import (
    ProviderConnectionBinding,
    ProviderProofVerifier,
    ProviderReject,
    ProviderRequest,
    sign_synthetic_provider_request,
)
from app.tools.facade_client import FacadeCommand, FacadeResult

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)
SECRET = b"m005-synthetic-provider-proof-secret"
CONNECTION_ID = "synthetic_connection_001"
ACCOUNT_BINDING = "a" * 64
NUMBER_BINDING = "b" * 64


def _command_payload(command: FacadeCommand) -> dict[str, object]:
    return {
        "commandId": command.command_id,
        "callId": command.call_id,
        "idempotencyKey": command.idempotency_key,
        "operation": command.operation,
        "locale": command.locale,
        "correlationId": command.correlation_id,
        "requestedAt": command.requested_at.isoformat().replace("+00:00", "Z"),
        "confirmed": command.confirmed,
    }


class JsonLineSyntheticBridge:
    def __init__(self) -> None:
        workspace = Path(__file__).resolve().parents[3]
        corepack = shutil.which("corepack")
        assert corepack is not None
        self._process = subprocess.Popen(
            [
                corepack,
                "pnpm",
                "exec",
                "tsx",
                "tests/m005/fixtures/voice-synthetic-worker.ts",
            ],
            cwd=workspace,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            bufsize=1,
        )

    def _request(self, payload: dict[str, object]) -> dict[str, Any]:
        assert self._process.stdin is not None
        assert self._process.stdout is not None
        self._process.stdin.write(json.dumps(payload, separators=(",", ":")) + "\n")
        self._process.stdin.flush()
        response = self._process.stdout.readline()
        if not response:
            assert self._process.stderr is not None
            raise AssertionError(self._process.stderr.read())
        decoded = json.loads(response)
        assert decoded.get("ok") is True, decoded
        return decoded

    def start_call(self, call: SyntheticCallStart) -> str:
        payload = asdict(call)
        payload["admitted_at"] = call.admitted_at.isoformat().replace("+00:00", "Z")
        response = self._request({"type": "start_call", "call": payload})
        return str(response["receiptId"])

    def issue_ticket(self, command: FacadeCommand) -> str:
        response = self._request(
            {"type": "issue_ticket", "command": _command_payload(command)}
        )
        return str(response["credential"])

    def execute(self, command: FacadeCommand, ticket: str) -> FacadeResult:
        response = self._request(
            {
                "type": "execute",
                "command": _command_payload(command),
                "credential": ticket,
            }
        )["result"]
        return FacadeResult(
            kind=response["kind"],
            outcome=response.get("outcome"),
            receipt_id=response.get("receiptId"),
        )

    def snapshot(self, call_id: str) -> dict[str, Any]:
        return self._request({"type": "snapshot", "callId": call_id})["snapshot"]

    def close(self) -> None:
        if self._process.poll() is None:
            self._request({"type": "close"})
            self._process.wait(timeout=5)


def test_default_synthetic_admission_is_disabled() -> None:
    rejected = default_synthetic_verifier().verify(
        ProviderRequest("POST", "application/json", None, "", "", "", "", "", "", b"{}")
    )
    assert isinstance(rejected, ProviderReject)
    assert rejected.code == "provider_disabled"


def test_authenticated_composition_persists_handoff_in_typescript() -> None:
    body = json.dumps(
        {
            "version": 1,
            "callId": "voice_call_composed_001",
            "correlationId": "voice_correlation_composed_001",
            "providerReferenceDigest": "c" * 64,
            "locale": "en",
            "cues": [
                "language_en",
                "unrecognized",
                "unrecognized",
                "unrecognized",
            ],
        },
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    timestamp = str(int(NOW.timestamp()))
    nonce = "synthetic_provider_nonce_000001"
    signature = sign_synthetic_provider_request(
        secret=SECRET,
        timestamp=timestamp,
        nonce=nonce,
        connection_id=CONNECTION_ID,
        account_binding_digest=ACCOUNT_BINDING,
        number_binding_digest=NUMBER_BINDING,
        body=body,
    )
    request = ProviderRequest(
        method="POST",
        content_type="application/json",
        content_encoding=None,
        connection_id=CONNECTION_ID,
        account_binding_digest=ACCOUNT_BINDING,
        number_binding_digest=NUMBER_BINDING,
        timestamp=timestamp,
        nonce=nonce,
        signature=signature,
        body=body,
    )
    verifier = ProviderProofVerifier(
        secret=SECRET,
        connections={
            CONNECTION_ID: ProviderConnectionBinding(
                connection_id=CONNECTION_ID,
                state="synthetic_verified",
                account_binding_digest=ACCOUNT_BINDING,
                number_binding_digest=NUMBER_BINDING,
            )
        },
        synthetic_admission_enabled=True,
        clock=lambda: NOW,
    )
    bridge = JsonLineSyntheticBridge()
    try:
        result = SyntheticVoiceComposition(
            verifier=verifier,
            bridge=bridge,
            clock=lambda: NOW,
        ).admit(request)
        snapshot = bridge.snapshot("voice_call_composed_001")
    finally:
        bridge.close()

    assert result.status == "accepted"
    assert result.final_action == "completed"
    assert result.receipt_id == "synthetic_transfer_receipt_001"
    assert snapshot == {
        "callId": "voice_call_composed_001",
        "lifecycle": "handoff",
        "transferStatus": "requested",
        "version": 2,
        "interactionCount": 1,
        "escalationCount": 1,
        "callbackCount": 0,
        "receiptState": "completed",
        "ownerReceiptId": "synthetic_transfer_receipt_001",
    }
