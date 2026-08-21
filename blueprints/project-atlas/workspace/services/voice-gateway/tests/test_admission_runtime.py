from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import json
from threading import Event

from app.composition.synthetic import SyntheticVoiceComposition
from app.runtime.admission import BoundedOperationRunner
from app.security.provider_proof import VerifiedProviderRequest

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)


class HungBridge:
    def __init__(self, release: Event) -> None:
        self.release = release

    def start_call(self, call: object) -> str:
        del call
        self.release.wait(timeout=2)
        return "voice_call_receipt_hung_001"

    def issue_ticket(self, command: object) -> str:
        raise AssertionError(command)

    def execute(self, command: object, ticket: str) -> object:
        raise AssertionError((command, ticket))


def test_hung_bridge_times_out_and_retains_capacity_until_cleanup() -> None:
    async def scenario() -> None:
        release = Event()
        composition = SyntheticVoiceComposition(
            verifier=object(),  # type: ignore[arg-type]
            bridge=HungBridge(release),  # type: ignore[arg-type]
            clock=lambda: NOW,
        )
        body = json.dumps(
            {
                "version": 1,
                "callId": "voice_call_hung_001",
                "correlationId": "voice_correlation_hung_001",
                "providerReferenceDigest": "c" * 64,
                "locale": "en",
                "cues": ["language_en"],
            },
            separators=(",", ":"),
            sort_keys=True,
        ).encode()
        verified = VerifiedProviderRequest(
            connection_id="synthetic_connection_001",
            body=body,
            body_digest="d" * 64,
            nonce="synthetic_provider_nonce_000001",
            verified_at=NOW,
        )
        runner: BoundedOperationRunner[str | None] = BoundedOperationRunner(
            capacity=1,
            timeout_milliseconds=20,
        )

        timed_out = await runner.run(lambda: composition.on_verified(verified))
        at_capacity = await runner.run(lambda: asyncio.sleep(0, result="receipt"))
        assert (timed_out.status, timed_out.reason) == ("unavailable", "timeout")
        assert (at_capacity.status, at_capacity.reason) == (
            "unavailable",
            "capacity",
        )
        assert runner.active_operations == 1

        release.set()
        for _ in range(50):
            if runner.active_operations == 0:
                break
            await asyncio.sleep(0.01)
        assert runner.active_operations == 0
        completed = await runner.run(lambda: asyncio.sleep(0, result="receipt"))
        assert (completed.status, completed.value) == ("completed", "receipt")

    asyncio.run(scenario())
