from datetime import UTC, datetime

from app.agents.reception import ReceptionSession
from app.policies.reception_policy import ReceptionPolicy
from app.tools.facade_client import (
    ALLOWED_FACADE_OPERATIONS,
    FacadeClient,
    FacadeCommand,
    FacadeResult,
)

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)


class RecordingTransport:
    def __init__(self) -> None:
        self.commands: list[FacadeCommand] = []

    def execute(self, command: FacadeCommand, ticket: str) -> FacadeResult:
        self.commands.append(command)
        return FacadeResult(
            kind="completed",
            outcome="public_information_ready",
            receipt_id="knowledge_receipt_001",
        )


def session() -> ReceptionSession:
    return ReceptionSession(
        call_id="voice_call_001",
        correlation_id="voice_correlation_001",
        facade=FacadeClient(RecordingTransport()),
        ticket_for=lambda command: f"synthetic_ticket_{command.command_id}",
        clock=lambda: NOW,
    )


def test_opening_discloses_virtual_reception_and_offers_both_languages() -> None:
    response = session().opening()
    assert response.action == "choose_language"
    assert response.prompt_key == "virtual_reception_disclosure_bilingual"
    assert response.locale is None
    assert response.question_count == 1


def test_language_selection_is_explicit_and_stays_selected() -> None:
    active = session()
    assert active.handle("maybe Spanish").action == "choose_language"
    selected = active.handle("Español")
    assert selected.action == "ask_purpose"
    assert selected.locale == "es"
    assert active.handle("What services do you offer?").locale == "es"


def test_policy_classifies_protected_and_professional_requests_without_tools() -> None:
    policy = ReceptionPolicy()
    assert policy.classify("What is my account number?", "en") == "protected_request"
    assert policy.classify("Quiero disputar mi crédito", "es") == "prohibited_request"
    assert "payment_mutation" not in ALLOWED_FACADE_OPERATIONS
    assert "professional_filing" not in ALLOWED_FACADE_OPERATIONS


def test_every_response_asks_at_most_one_question() -> None:
    active = session()
    responses = [
        active.opening(),
        active.handle("English"),
        active.handle("I need an appointment"),
        active.handle("yes"),
    ]
    assert all(response.question_count <= 1 for response in responses)
