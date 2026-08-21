from __future__ import annotations

from typing import Protocol

from app.contracts import (
    ProviderContext,
    ProviderResult,
    SyntheticCallGrant,
    SyntheticInboundCall,
    SyntheticModelTurn,
    SyntheticSpeech,
    SyntheticSpeechRequest,
    SyntheticUtterance,
)


class CancellationSignal(Protocol):
    def is_cancelled(self) -> bool:
        """Return a local cancellation decision without external I/O."""


class TelephonyProvider(Protocol):
    async def accept_inbound(
        self,
        request: SyntheticInboundCall,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[SyntheticCallGrant]: ...


class SpeechToTextProvider(Protocol):
    async def transcribe(
        self,
        request: SyntheticUtterance,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[str]: ...


class VoiceModelProvider(Protocol):
    async def respond(
        self,
        request: SyntheticModelTurn,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[str]: ...


class TextToSpeechProvider(Protocol):
    async def synthesize(
        self,
        request: SyntheticSpeechRequest,
        context: ProviderContext,
        cancellation: CancellationSignal,
    ) -> ProviderResult[SyntheticSpeech]: ...
