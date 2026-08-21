from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from app.policies.reception_policy import ReceptionPolicy, VoiceLocale
from app.policies.sensitive_input import SensitiveInputGuard
from app.tools.facade_client import (
    FacadeClient,
    FacadeCommand,
    FacadeOperation,
    FacadeOutcome,
)

ReceptionAction = Literal[
    "choose_language",
    "ask_purpose",
    "confirmation_required",
    "completed",
    "verification_required",
    "portal_or_handoff",
    "misunderstood",
    "cancelled",
    "unavailable",
]


@dataclass(frozen=True, slots=True)
class ReceptionResponse:
    action: ReceptionAction
    prompt_key: str
    locale: VoiceLocale | None
    question_count: Literal[0, 1]
    outcome: FacadeOutcome | None = None


class ReceptionSession:
    def __init__(
        self,
        *,
        call_id: str,
        correlation_id: str,
        facade: FacadeClient,
        ticket_for: Callable[[FacadeCommand], str],
        clock: Callable[[], datetime],
        policy: ReceptionPolicy | None = None,
        sensitive_input: SensitiveInputGuard | None = None,
    ) -> None:
        self._call_id = call_id
        self._correlation_id = correlation_id
        self._facade = facade
        self._ticket_for = ticket_for
        self._clock = clock
        self._policy = policy or ReceptionPolicy()
        self._sensitive_input = sensitive_input or SensitiveInputGuard()
        self._locale: VoiceLocale | None = None
        self._pending_operation: FacadeOperation | None = None
        self._command_sequence = 0
        self._unrecognized_turns = 0

    @property
    def unrecognized_turns(self) -> int:
        return self._unrecognized_turns

    def opening(self) -> ReceptionResponse:
        return ReceptionResponse(
            action="choose_language",
            prompt_key="virtual_reception_disclosure_bilingual",
            locale=None,
            question_count=1,
        )

    def handle(self, turn: str) -> ReceptionResponse:
        inspected = self._sensitive_input.inspect(turn)
        if not inspected.allowed or inspected.text is None:
            self._pending_operation = None
            self._unrecognized_turns = 0
            return self._response(
                "portal_or_handoff",
                "sensitive_input_blocked",
                question=True,
            )
        turn = inspected.text
        if self._locale is None:
            selected = self._policy.select_language(turn)
            if selected is None:
                return self.opening()
            self._locale = selected
            self._unrecognized_turns = 0
            return self._response("ask_purpose", "ask_purpose", question=True)

        intent = self._policy.classify(turn, self._locale)
        if self._pending_operation is not None:
            if intent == "affirm":
                operation = self._pending_operation
                self._pending_operation = None
                return self._execute(operation, confirmed=True)
            if intent == "cancel":
                self._pending_operation = None
                self._unrecognized_turns = 0
                return self._response("cancelled", "action_cancelled", question=True)
            return self._response(
                "confirmation_required",
                "confirm_pending_action",
                question=True,
            )

        if intent == "protected_request":
            self._unrecognized_turns = 0
            return self._response(
                "verification_required",
                "verification_portal_or_handoff",
                question=True,
            )
        if intent == "prohibited_request":
            self._unrecognized_turns = 0
            return self._response(
                "portal_or_handoff",
                "professional_action_unavailable",
                question=True,
            )
        if intent == "appointment":
            return self._request_confirmation("request_appointment")
        if intent == "callback":
            return self._request_confirmation("request_callback")
        if intent == "message":
            return self._request_confirmation("take_message")
        if intent == "human":
            return self._execute("request_transfer", confirmed=False)
        if intent == "public_information":
            return self._execute("provide_public_information", confirmed=False)

        self._unrecognized_turns += 1
        return self._response("misunderstood", "request_not_understood", question=True)

    def _request_confirmation(self, operation: FacadeOperation) -> ReceptionResponse:
        self._pending_operation = operation
        self._unrecognized_turns = 0
        return self._response(
            "confirmation_required",
            f"confirm_{operation}",
            question=True,
        )

    def _execute(self, operation: FacadeOperation, *, confirmed: bool) -> ReceptionResponse:
        self._command_sequence += 1
        command_id = f"{self._call_id}_cmd_{self._command_sequence:04d}"
        command = FacadeCommand(
            command_id=command_id,
            call_id=self._call_id,
            idempotency_key=f"{command_id}_idempotency",
            operation=operation,
            locale=self._locale or "es",
            correlation_id=self._correlation_id,
            requested_at=self._clock(),
            confirmed=confirmed,
        )
        result = self._facade.execute(command, self._ticket_for(command))
        self._unrecognized_turns = 0
        if result.kind == "completed" and result.outcome is not None:
            return self._response(
                "completed",
                f"{result.outcome}_confirmed",
                question=False,
                outcome=result.outcome,
            )
        if result.kind == "verification_required":
            return self._response(
                "verification_required",
                "verification_portal_or_handoff",
                question=True,
            )
        if result.kind == "confirmation_required":
            return self._response(
                "confirmation_required",
                "confirm_pending_action",
                question=True,
            )
        if result.kind == "denied":
            return self._response(
                "portal_or_handoff",
                "action_denied_portal_or_handoff",
                question=True,
            )
        return self._response(
            "unavailable",
            "facade_unavailable",
            question=True,
        )

    def _response(
        self,
        action: ReceptionAction,
        prompt: str,
        *,
        question: bool,
        outcome: FacadeOutcome | None = None,
    ) -> ReceptionResponse:
        locale = self._locale
        prompt_key = f"{prompt}_{locale}" if locale is not None else prompt
        return ReceptionResponse(
            action=action,
            prompt_key=prompt_key,
            locale=locale,
            question_count=1 if question else 0,
            outcome=outcome,
        )
