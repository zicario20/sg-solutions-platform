from datetime import UTC, datetime

from app.agents.reception import ReceptionSession
from app.policies.sensitive_input import SensitiveInputGuard
from app.tools.facade_client import FacadeClient, FacadeCommand, FacadeResult

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)


class RecordingTransport:
    def __init__(self) -> None:
        self.commands: list[FacadeCommand] = []

    def execute(self, command: FacadeCommand, ticket: str) -> FacadeResult:
        self.commands.append(command)
        return FacadeResult(
            kind="completed",
            outcome="appointment_requested",
            receipt_id="appointment_receipt_redaction_001",
        )


def test_ssn_and_card_segments_are_discarded_without_echo() -> None:
    guard = SensitiveInputGuard()
    for value, reason in (
        ("my SSN is 123-45-6789", "government_identifier_pattern"),
        ("my card is 4111 1111 1111 1111", "payment_card_pattern"),
    ):
        result = guard.inspect(value)
        assert result.allowed is False
        assert result.text is None
        assert result.reason_code == reason
        assert value not in repr(result)
        assert not any(character.isdigit() for character in repr(result))


def test_credential_labels_fail_closed_without_downstream_command() -> None:
    transport = RecordingTransport()
    active = ReceptionSession(
        call_id="voice_call_redaction",
        correlation_id="voice_correlation_redaction",
        facade=FacadeClient(transport),
        ticket_for=lambda command: f"synthetic_ticket_{command.command_id}",
        clock=lambda: NOW,
    )
    active.handle("English")
    response = active.handle("my password is synthetic-secret")
    assert response.action == "portal_or_handoff"
    assert response.prompt_key == "sensitive_input_blocked_en"
    assert "synthetic-secret" not in repr(response)
    assert transport.commands == []


def test_safe_turn_continues_to_controlled_confirmation() -> None:
    transport = RecordingTransport()
    active = ReceptionSession(
        call_id="voice_call_safe_turn",
        correlation_id="voice_correlation_safe_turn",
        facade=FacadeClient(transport),
        ticket_for=lambda command: f"synthetic_ticket_{command.command_id}",
        clock=lambda: NOW,
    )
    active.handle("English")
    response = active.handle("I need an appointment")
    assert response.action == "confirmation_required"
    assert transport.commands == []
