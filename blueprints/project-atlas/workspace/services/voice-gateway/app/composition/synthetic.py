from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
import json
import re
from typing import Literal, Protocol, cast

from app.agents.reception import ReceptionSession
from app.security.provider_proof import (
    ProviderProofVerifier,
    ProviderReject,
    ProviderRequest,
    VerifiedProviderRequest,
)
from app.tools.facade_client import FacadeClient, FacadeCommand, FacadeTransport

SyntheticCue = Literal[
    "language_es",
    "language_en",
    "appointment",
    "callback",
    "message",
    "affirm",
    "unrecognized",
]
CompositionStatus = Literal["accepted", "rejected", "unavailable"]

_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$")
_DIGEST = re.compile(r"^[0-9a-f]{64}$")
_CUES: frozenset[str] = frozenset(
    {
        "language_es",
        "language_en",
        "appointment",
        "callback",
        "message",
        "affirm",
        "unrecognized",
    }
)
_TURN_BY_CUE: dict[SyntheticCue, str] = {
    "language_es": "Español",
    "language_en": "English",
    "appointment": "appointment",
    "callback": "callback",
    "message": "leave a message",
    "affirm": "yes",
    "unrecognized": "synthetic-unknown",
}


@dataclass(frozen=True, slots=True)
class SyntheticCallStart:
    call_id: str
    correlation_id: str
    provider_connection_id: str
    provider_reference_digest: str
    body_digest: str
    locale: Literal["es", "en"]
    admitted_at: datetime


@dataclass(frozen=True, slots=True)
class SyntheticCompositionResult:
    status: CompositionStatus
    code: str
    receipt_id: str | None = None
    final_action: str | None = None


class SyntheticFacadeBridge(FacadeTransport, Protocol):
    def start_call(self, call: SyntheticCallStart) -> str: ...

    def issue_ticket(self, command: FacadeCommand) -> str: ...


@dataclass(frozen=True, slots=True)
class _Envelope:
    call_id: str
    correlation_id: str
    provider_reference_digest: str
    locale: Literal["es", "en"]
    cues: tuple[SyntheticCue, ...]


def _reject_duplicates(pairs: list[tuple[str, object]]) -> dict[str, object]:
    value: dict[str, object] = {}
    for key, item in pairs:
        if key in value:
            raise ValueError("duplicate_key")
        value[key] = item
    return value


def _decode(body: bytes) -> _Envelope:
    try:
        value = json.loads(body.decode("utf-8"), object_pairs_hook=_reject_duplicates)
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
        raise ValueError("invalid_envelope") from error
    if not isinstance(value, dict) or set(value) != {
        "version",
        "callId",
        "correlationId",
        "providerReferenceDigest",
        "locale",
        "cues",
    }:
        raise ValueError("invalid_envelope")
    call_id = value["callId"]
    correlation_id = value["correlationId"]
    reference_digest = value["providerReferenceDigest"]
    locale = value["locale"]
    cues = value["cues"]
    if (
        type(value["version"]) is not int
        or value["version"] != 1
        or not isinstance(call_id, str)
        or not _ID.fullmatch(call_id)
        or not isinstance(correlation_id, str)
        or not _ID.fullmatch(correlation_id)
        or not isinstance(reference_digest, str)
        or not _DIGEST.fullmatch(reference_digest)
        or locale not in ("es", "en")
        or not isinstance(cues, list)
        or not 1 <= len(cues) <= 8
        or any(not isinstance(cue, str) or cue not in _CUES for cue in cues)
        or cues[0] != f"language_{locale}"
    ):
        raise ValueError("invalid_envelope")
    return _Envelope(
        call_id=call_id,
        correlation_id=correlation_id,
        provider_reference_digest=reference_digest,
        locale=locale,
        cues=tuple(cast(SyntheticCue, cue) for cue in cues),
    )


def default_synthetic_verifier() -> ProviderProofVerifier:
    return ProviderProofVerifier(
        secret=b"\x00" * 32,
        connections={},
        synthetic_admission_enabled=False,
    )


class SyntheticVoiceComposition:
    def __init__(
        self,
        *,
        verifier: ProviderProofVerifier,
        bridge: SyntheticFacadeBridge,
        clock: Callable[[], datetime] = lambda: datetime.now(tz=UTC),
    ) -> None:
        self._verifier = verifier
        self._bridge = bridge
        self._clock = clock

    @property
    def verifier(self) -> ProviderProofVerifier:
        return self._verifier

    def admit(self, request: ProviderRequest) -> SyntheticCompositionResult:
        verified = self._verifier.verify(request)
        if isinstance(verified, ProviderReject):
            return SyntheticCompositionResult(status="rejected", code=verified.code)
        return self._compose(verified)

    async def on_verified(self, verified: VerifiedProviderRequest) -> str | None:
        result = self._compose(verified)
        return result.receipt_id if result.status == "accepted" else None

    def _compose(
        self,
        verified: VerifiedProviderRequest,
    ) -> SyntheticCompositionResult:
        try:
            envelope = _decode(verified.body)
            start_receipt = self._bridge.start_call(
                SyntheticCallStart(
                    call_id=envelope.call_id,
                    correlation_id=envelope.correlation_id,
                    provider_connection_id=verified.connection_id,
                    provider_reference_digest=envelope.provider_reference_digest,
                    body_digest=verified.body_digest,
                    locale=envelope.locale,
                    admitted_at=verified.verified_at,
                )
            )
            session = ReceptionSession(
                call_id=envelope.call_id,
                correlation_id=envelope.correlation_id,
                facade=FacadeClient(self._bridge),
                ticket_for=self._bridge.issue_ticket,
                clock=self._clock,
            )
            final = session.opening()
            for cue in envelope.cues:
                final = session.handle(_TURN_BY_CUE[cue])
        except (KeyError, TypeError, ValueError):
            return SyntheticCompositionResult(
                status="rejected",
                code="synthetic_contract_invalid",
            )
        except Exception:
            return SyntheticCompositionResult(
                status="unavailable",
                code="synthetic_platform_unavailable",
            )
        if final.action == "unavailable":
            return SyntheticCompositionResult(
                status="unavailable",
                code="synthetic_facade_unavailable",
                final_action=final.action,
            )
        return SyntheticCompositionResult(
            status="accepted",
            code="synthetic_call_processed",
            receipt_id=final.receipt_id or start_receipt,
            final_action=final.action,
        )
