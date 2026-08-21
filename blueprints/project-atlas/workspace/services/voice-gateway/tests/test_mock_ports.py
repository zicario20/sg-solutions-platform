import asyncio
from datetime import UTC, datetime, timedelta

from app.contracts import (
    ProviderContext,
    SyntheticInboundCall,
    SyntheticModelTurn,
    SyntheticSpeechRequest,
    SyntheticUtterance,
)
from app.providers.mock import (
    FixedCancellationSignal,
    MockSpeechToTextProvider,
    MockTelephonyProvider,
    MockTextToSpeechProvider,
    MockVoiceModelProvider,
)

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)


def context(*, expired: bool = False) -> ProviderContext:
    return ProviderContext(
        call_id="voice_call_001",
        correlation_id="voice_correlation_001",
        locale="es",
        deadline_at=NOW - timedelta(seconds=1)
        if expired
        else NOW + timedelta(seconds=5),
    )


def test_mock_ports_return_deterministic_metadata_only_values() -> None:
    async def exercise() -> None:
        signal = FixedCancellationSignal(False)
        telephony = MockTelephonyProvider(clock=lambda: NOW)
        stt = MockSpeechToTextProvider(clock=lambda: NOW)
        model = MockVoiceModelProvider(clock=lambda: NOW)
        tts = MockTextToSpeechProvider(clock=lambda: NOW)

        call = await telephony.accept_inbound(
            SyntheticInboundCall(
                call_id="voice_call_001",
                provider_reference_digest="a" * 64,
                locale="es",
            ),
            context(),
            signal,
        )
        utterance = await stt.transcribe(
            SyntheticUtterance(cue="appointment_es"),
            context(),
            signal,
        )
        response = await model.respond(
            SyntheticModelTurn(intent="appointment_request", locale="es"),
            context(),
            signal,
        )
        speech = await tts.synthesize(
            SyntheticSpeechRequest(response_key="appointment_confirmation_es", locale="es"),
            context(),
            signal,
        )

        assert call.value is not None and call.value.provider_mode == "mock"
        assert utterance.value == "Necesito una cita"
        assert response.value == "appointment_confirmation_es"
        assert speech.value is not None
        assert speech.value.reference == "mock_speech:appointment_confirmation_es"
        assert "audio" not in speech.value.__dataclass_fields__

    asyncio.run(exercise())


def test_mock_ports_normalize_cancellation_before_work() -> None:
    async def exercise() -> None:
        result = await MockTelephonyProvider(clock=lambda: NOW).accept_inbound(
            SyntheticInboundCall(
                call_id="voice_call_001",
                provider_reference_digest="a" * 64,
                locale="es",
            ),
            context(),
            FixedCancellationSignal(True),
        )
        assert result.value is None
        assert result.failure is not None
        assert result.failure.code == "cancelled"

    asyncio.run(exercise())


def test_mock_ports_normalize_expired_deadlines() -> None:
    async def exercise() -> None:
        result = await MockSpeechToTextProvider(clock=lambda: NOW).transcribe(
            SyntheticUtterance(cue="appointment_es"),
            context(expired=True),
            FixedCancellationSignal(False),
        )
        assert result.value is None
        assert result.failure is not None
        assert result.failure.code == "deadline_exceeded"

    asyncio.run(exercise())
