from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime

from app.contracts import (
    ProviderContext,
    ProviderFailure,
    ProviderResult,
    SyntheticCallGrant,
    SyntheticInboundCall,
    SyntheticModelTurn,
    SyntheticSpeech,
    SyntheticSpeechRequest,
    SyntheticUtterance,
)
from app.providers.ports import CancellationSignal

Clock = Callable[[], datetime]


class FixedCancellationSignal:
    def __init__(self, cancelled: bool) -> None:
        self._cancelled = cancelled

    def is_cancelled(self) -> bool:
        return self._cancelled


def _guard(
    context: ProviderContext,
    cancellation: CancellationSignal,
    clock: Clock,
) -> ProviderFailure | None:
    if cancellation.is_cancelled():
        return ProviderFailure(code="cancelled")
    if context.deadline_at <= clock():
        return ProviderFailure(code="deadline_exceeded")
    return None


def _system_clock() -> datetime:
    return datetime.now(tz=UTC)


class MockTelephonyProvider:
    def __init__(self, clock: Clock = _system_clock) -> None:
        self._clock = clock

    async def accept_inbound(
        self,
        request: SyntheticInboundCall,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[SyntheticCallGrant]:
        failure = _guard(context, cancellation, self._clock)
        if failure:
            return ProviderResult.failed(failure.code)
        if (
            request.call_id != context.call_id
            or len(request.provider_reference_digest) != 64
            or any(character not in "0123456789abcdef" for character in request.provider_reference_digest)
        ):
            return ProviderResult.failed("invalid_request")
        return ProviderResult.success(
            SyntheticCallGrant(
                call_id=request.call_id,
                provider_mode="mock",
                provider_reference_digest=request.provider_reference_digest,
            )
        )


class MockSpeechToTextProvider:
    _utterances = {
        "appointment_es": "Necesito una cita",
        "appointment_en": "I need an appointment",
        "callback_es": "Necesito una llamada",
        "callback_en": "I need a callback",
    }

    def __init__(self, clock: Clock = _system_clock) -> None:
        self._clock = clock

    async def transcribe(
        self,
        request: SyntheticUtterance,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[str]:
        failure = _guard(context, cancellation, self._clock)
        if failure:
            return ProviderResult.failed(failure.code)
        value = self._utterances.get(request.cue)
        return ProviderResult.success(value) if value else ProviderResult.failed("invalid_request")


class MockVoiceModelProvider:
    _responses = {
        ("appointment_request", "es"): "appointment_confirmation_es",
        ("appointment_request", "en"): "appointment_confirmation_en",
        ("callback_request", "es"): "callback_confirmation_es",
        ("callback_request", "en"): "callback_confirmation_en",
        ("public_information", "es"): "public_information_es",
        ("public_information", "en"): "public_information_en",
    }

    def __init__(self, clock: Clock = _system_clock) -> None:
        self._clock = clock

    async def respond(
        self,
        request: SyntheticModelTurn,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[str]:
        failure = _guard(context, cancellation, self._clock)
        if failure:
            return ProviderResult.failed(failure.code)
        response = self._responses.get((request.intent, request.locale))
        return (
            ProviderResult.success(response)
            if response
            else ProviderResult.failed("invalid_request")
        )


class MockTextToSpeechProvider:
    def __init__(self, clock: Clock = _system_clock) -> None:
        self._clock = clock

    async def synthesize(
        self,
        request: SyntheticSpeechRequest,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[SyntheticSpeech]:
        failure = _guard(context, cancellation, self._clock)
        if failure:
            return ProviderResult.failed(failure.code)
        if not request.response_key or len(request.response_key) > 96:
            return ProviderResult.failed("invalid_request")
        return ProviderResult.success(
            SyntheticSpeech(
                reference=f"mock_speech:{request.response_key}",
                locale=request.locale,
            )
        )
