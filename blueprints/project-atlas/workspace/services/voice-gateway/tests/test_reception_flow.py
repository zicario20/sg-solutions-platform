from datetime import UTC, datetime

from app.agents.reception import ReceptionSession
from app.tools.facade_client import FacadeClient, FacadeCommand, FacadeResult

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)


class ScenarioTransport:
    def __init__(self, *, invalid_result: bool = False) -> None:
        self.commands: list[FacadeCommand] = []
        self.invalid_result = invalid_result

    def execute(self, command: FacadeCommand, ticket: str) -> FacadeResult:
        assert ticket == f"synthetic_ticket_{command.command_id}"
        self.commands.append(command)
        if self.invalid_result:
            return FacadeResult(
                kind="completed",
                outcome="lead_created",
                receipt_id="wrong_receipt_001",
            )
        outcomes = {
            "provide_public_information": "public_information_ready",
            "request_appointment": "appointment_requested",
            "request_callback": "callback_requested",
            "take_message": "message_recorded",
            "request_transfer": "transfer_requested",
        }
        return FacadeResult(
            kind="completed",
            outcome=outcomes[command.operation],
            receipt_id=f"{command.operation}_receipt_001",
        )


def make_session(transport: ScenarioTransport) -> ReceptionSession:
    return ReceptionSession(
        call_id="voice_call_001",
        correlation_id="voice_correlation_001",
        facade=FacadeClient(transport),
        ticket_for=lambda command: f"synthetic_ticket_{command.command_id}",
        clock=lambda: NOW,
    )


def test_appointment_requires_confirmation_before_facade_execution() -> None:
    transport = ScenarioTransport()
    active = make_session(transport)
    active.handle("English")
    pending = active.handle("I need an appointment")
    assert pending.action == "confirmation_required"
    assert transport.commands == []

    completed = active.handle("yes")
    assert completed.action == "completed"
    assert completed.outcome == "appointment_requested"
    assert len(transport.commands) == 1
    assert transport.commands[0].confirmed is True
    assert transport.commands[0].operation == "request_appointment"


def test_sensitive_request_requires_verification_then_portal_or_handoff() -> None:
    transport = ScenarioTransport()
    active = make_session(transport)
    active.handle("English")
    response = active.handle("What is my account number?")
    assert response.action == "verification_required"
    assert response.prompt_key == "verification_portal_or_handoff_en"
    assert transport.commands == []


def test_professional_request_has_no_callable_command() -> None:
    transport = ScenarioTransport()
    active = make_session(transport)
    active.handle("Español")
    response = active.handle("Quiero que presentes mis impuestos")
    assert response.action == "portal_or_handoff"
    assert transport.commands == []


def test_public_information_uses_only_the_facade_allowlist() -> None:
    transport = ScenarioTransport()
    active = make_session(transport)
    active.handle("English")
    response = active.handle("What services do you offer?")
    assert response.action == "completed"
    assert response.outcome == "public_information_ready"
    assert [value.operation for value in transport.commands] == [
        "provide_public_information"
    ]


def test_mismatched_facade_outcome_fails_closed() -> None:
    active = make_session(ScenarioTransport(invalid_result=True))
    active.handle("English")
    assert active.handle("What services do you offer?").action == "unavailable"
