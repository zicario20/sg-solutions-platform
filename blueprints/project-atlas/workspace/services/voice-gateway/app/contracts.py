from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Generic, Literal, TypeVar

VoiceLocale = Literal["es", "en"]
ProviderFailureCode = Literal[
    "cancelled",
    "deadline_exceeded",
    "disabled",
    "invalid_request",
    "unavailable",
]
SyntheticCue = Literal[
    "appointment_es",
    "appointment_en",
    "callback_es",
    "callback_en",
]
SyntheticIntent = Literal[
    "appointment_request",
    "callback_request",
    "public_information",
]


@dataclass(frozen=True, slots=True)
class ProviderContext:
    call_id: str
    correlation_id: str
    locale: VoiceLocale
    deadline_at: datetime


@dataclass(frozen=True, slots=True)
class ProviderFailure:
    code: ProviderFailureCode


T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class ProviderResult(Generic[T]):
    value: T | None
    failure: ProviderFailure | None

    @classmethod
    def success(cls, value: T) -> ProviderResult[T]:
        return cls(value=value, failure=None)

    @classmethod
    def failed(cls, code: ProviderFailureCode) -> ProviderResult[T]:
        return cls(value=None, failure=ProviderFailure(code=code))


@dataclass(frozen=True, slots=True)
class SyntheticInboundCall:
    call_id: str
    provider_reference_digest: str
    locale: VoiceLocale


@dataclass(frozen=True, slots=True)
class SyntheticCallGrant:
    call_id: str
    provider_mode: Literal["mock"]
    provider_reference_digest: str


@dataclass(frozen=True, slots=True)
class SyntheticUtterance:
    cue: SyntheticCue


@dataclass(frozen=True, slots=True)
class SyntheticModelTurn:
    intent: SyntheticIntent
    locale: VoiceLocale


@dataclass(frozen=True, slots=True)
class SyntheticSpeechRequest:
    response_key: str
    locale: VoiceLocale


@dataclass(frozen=True, slots=True)
class SyntheticSpeech:
    reference: str
    locale: VoiceLocale
