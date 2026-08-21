from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

FallbackAction = Literal[
    "continue",
    "transfer",
    "voicemail",
    "callback",
    "end",
]
FallbackFailure = Literal[
    "provider_unavailable",
    "media_unavailable",
    "facade_unavailable",
    "speech_unavailable",
    "model_unavailable",
    "human_unavailable",
]


@dataclass(frozen=True, slots=True)
class FallbackDecision:
    action: FallbackAction
    prompt_key: str
    requires_facade_receipt: bool


class FallbackPolicy:
    def __init__(self, *, synthetic_provider_voicemail_enabled: bool = False) -> None:
        self._synthetic_provider_voicemail_enabled = (
            synthetic_provider_voicemail_enabled
        )

    def next(
        self,
        unrecognized_turns: int,
        failure: FallbackFailure | None,
    ) -> FallbackDecision:
        if failure == "facade_unavailable":
            if self._synthetic_provider_voicemail_enabled:
                return FallbackDecision(
                    action="voicemail",
                    prompt_key="synthetic_provider_voicemail",
                    requires_facade_receipt=False,
                )
            return FallbackDecision(
                action="end",
                prompt_key="platform_unavailable_end_honestly",
                requires_facade_receipt=False,
            )
        if failure == "provider_unavailable":
            return FallbackDecision(
                action="callback",
                prompt_key="provider_unavailable_offer_callback",
                requires_facade_receipt=True,
            )
        if failure in {
            "media_unavailable",
            "speech_unavailable",
            "model_unavailable",
        }:
            return FallbackDecision(
                action="transfer",
                prompt_key="automation_unavailable_offer_transfer",
                requires_facade_receipt=True,
            )
        if failure == "human_unavailable":
            return FallbackDecision(
                action="callback",
                prompt_key="human_unavailable_offer_callback",
                requires_facade_receipt=True,
            )
        if unrecognized_turns >= 3:
            return FallbackDecision(
                action="transfer",
                prompt_key="misunderstood_limit_offer_transfer",
                requires_facade_receipt=True,
            )
        if unrecognized_turns == 2:
            return FallbackDecision(
                action="continue",
                prompt_key="constrained_transfer_message_callback",
                requires_facade_receipt=False,
            )
        return FallbackDecision(
            action="continue",
            prompt_key="repeat_one_short_question",
            requires_facade_receipt=False,
        )
