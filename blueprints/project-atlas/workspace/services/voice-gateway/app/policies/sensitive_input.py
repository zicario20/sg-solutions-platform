from __future__ import annotations

from dataclasses import dataclass
import re
import unicodedata
from typing import Literal

SensitiveReason = Literal[
    "government_identifier_pattern",
    "payment_card_pattern",
    "credential_pattern",
    "input_invalid",
]

_SSN_OR_ITIN = re.compile(r"(?<!\d)(?:\d{3}[- ]?\d{2}[- ]?\d{4}|\d{9})(?!\d)")
_LONG_DIGIT_SEQUENCE = re.compile(r"(?<!\d)(?:\d[ -]?){13,19}(?!\d)")
_CREDENTIAL_DISCLOSURE = re.compile(
    r"\b(?:my |mi )?(?:password|passcode|pin|api[ -]?key|secret|"
    r"contrase(?:n|ñ)a|clave|routing number|account number|numero de cuenta|"
    r"número de cuenta)\s*(?:is|es|:)\s*\S+",
    re.IGNORECASE,
)


@dataclass(frozen=True, slots=True)
class SensitiveInputDecision:
    allowed: bool
    text: str | None
    reason_code: SensitiveReason | None


class SensitiveInputGuard:
    def inspect(self, turn: str) -> SensitiveInputDecision:
        if not isinstance(turn, str) or len(turn) > 512:
            return SensitiveInputDecision(
                allowed=False,
                text=None,
                reason_code="input_invalid",
            )
        normalized = unicodedata.normalize("NFKC", turn)
        if any(ord(character) < 32 and character not in "\t\n\r" for character in normalized):
            return SensitiveInputDecision(
                allowed=False,
                text=None,
                reason_code="input_invalid",
            )
        if _SSN_OR_ITIN.search(normalized):
            return SensitiveInputDecision(
                allowed=False,
                text=None,
                reason_code="government_identifier_pattern",
            )
        if _LONG_DIGIT_SEQUENCE.search(normalized):
            return SensitiveInputDecision(
                allowed=False,
                text=None,
                reason_code="payment_card_pattern",
            )
        if _CREDENTIAL_DISCLOSURE.search(normalized):
            return SensitiveInputDecision(
                allowed=False,
                text=None,
                reason_code="credential_pattern",
            )
        return SensitiveInputDecision(allowed=True, text=normalized, reason_code=None)
