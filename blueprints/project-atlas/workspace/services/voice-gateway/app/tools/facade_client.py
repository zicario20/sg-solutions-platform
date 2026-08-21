from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re
from typing import Literal, Protocol

FacadeOperation = Literal[
    "lookup_caller_hint",
    "provide_public_information",
    "request_availability",
    "create_lead",
    "request_appointment",
    "request_callback",
    "take_message",
    "request_transfer",
    "request_voicemail",
    "send_approved_link",
    "safe_status",
    "payment_projection",
    "missing_documents",
    "next_appointment",
    "secure_message",
]
FacadeResultKind = Literal[
    "completed",
    "verification_required",
    "confirmation_required",
    "denied",
    "unavailable",
]
FacadeOutcome = Literal[
    "contact_hint_processed",
    "public_information_ready",
    "availability_ready",
    "lead_created",
    "appointment_requested",
    "callback_requested",
    "message_recorded",
    "transfer_requested",
    "voicemail_requested",
    "approved_link_requested",
    "portal_required",
    "safe_status_ready",
    "payment_projection_ready",
    "missing_documents_ready",
    "next_appointment_ready",
    "secure_message_recorded",
]

ALLOWED_FACADE_OPERATIONS: frozenset[str] = frozenset(
    {
        "lookup_caller_hint",
        "provide_public_information",
        "request_availability",
        "create_lead",
        "request_appointment",
        "request_callback",
        "take_message",
        "request_transfer",
        "request_voicemail",
        "send_approved_link",
        "safe_status",
        "payment_projection",
        "missing_documents",
        "next_appointment",
        "secure_message",
    }
)

_EXPECTED_OUTCOME: dict[str, str] = {
    "lookup_caller_hint": "contact_hint_processed",
    "provide_public_information": "public_information_ready",
    "request_availability": "availability_ready",
    "create_lead": "lead_created",
    "request_appointment": "appointment_requested",
    "request_callback": "callback_requested",
    "take_message": "message_recorded",
    "request_transfer": "transfer_requested",
    "request_voicemail": "voicemail_requested",
    "send_approved_link": "approved_link_requested",
    "safe_status": "safe_status_ready",
    "payment_projection": "payment_projection_ready",
    "missing_documents": "missing_documents_ready",
    "next_appointment": "next_appointment_ready",
    "secure_message": "secure_message_recorded",
}
_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$")
_RESULT_KINDS = {
    "completed",
    "verification_required",
    "confirmation_required",
    "denied",
    "unavailable",
}


@dataclass(frozen=True, slots=True)
class FacadeCommand:
    command_id: str
    call_id: str
    idempotency_key: str
    operation: FacadeOperation
    locale: Literal["es", "en"]
    correlation_id: str
    requested_at: datetime
    confirmed: bool


@dataclass(frozen=True, slots=True)
class FacadeResult:
    kind: FacadeResultKind
    outcome: FacadeOutcome | None = None
    receipt_id: str | None = None


class FacadeTransport(Protocol):
    def execute(self, command: FacadeCommand, ticket: str) -> FacadeResult: ...


class FacadeClient:
    def __init__(self, transport: FacadeTransport) -> None:
        self._transport = transport

    def execute(self, command: FacadeCommand, ticket: str) -> FacadeResult:
        if (
            command.operation not in ALLOWED_FACADE_OPERATIONS
            or not _ID.fullmatch(command.command_id)
            or not _ID.fullmatch(command.call_id)
            or not _ID.fullmatch(command.idempotency_key)
            or not _ID.fullmatch(command.correlation_id)
            or command.requested_at.tzinfo is None
            or not 16 <= len(ticket) <= 2_048
            or any(character.isspace() for character in ticket)
        ):
            return FacadeResult(kind="denied")
        try:
            result = self._transport.execute(command, ticket)
        except Exception:
            return FacadeResult(kind="unavailable")
        if result.kind not in _RESULT_KINDS:
            return FacadeResult(kind="unavailable")
        if result.kind == "completed":
            if (
                result.outcome != _EXPECTED_OUTCOME.get(command.operation)
                or result.receipt_id is None
                or not _ID.fullmatch(result.receipt_id)
            ):
                return FacadeResult(kind="unavailable")
            return result
        if result.outcome is not None or result.receipt_id is not None:
            return FacadeResult(kind="unavailable")
        return result
