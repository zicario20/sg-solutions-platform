from datetime import UTC, datetime, timedelta

from app.security.session_ticket import (
    SessionGrant,
    SessionTicketVerifier,
    TicketReject,
    issue_synthetic_session_ticket,
)
from app.security.replay_repository import BoundedMemoryAtomicNonceRepository
from app.security.websocket_protocol import ticket_from_subprotocol_header

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)
SECRET = b"synthetic-media-ticket-secret-00000000000000000000000000"


def ticket(
    *,
    nonce: str = "media_ticket_nonce_0000000001",
    issued_at: datetime | None = None,
    expires_at: datetime | None = None,
) -> str:
    return issue_synthetic_session_ticket(
        secret=SECRET,
        call_id="voice_call_001",
        provider_stream_id="mock_stream_001",
        authorization_version=3,
        nonce=nonce,
        issued_at=issued_at or NOW - timedelta(seconds=1),
        expires_at=expires_at or NOW + timedelta(seconds=30),
    )


def verifier(*, enabled: bool = True) -> SessionTicketVerifier:
    return SessionTicketVerifier(
        secret=SECRET,
        synthetic_media_enabled=enabled,
        clock=lambda: NOW,
        nonce_repository=BoundedMemoryAtomicNonceRepository(capacity=8),
        allow_bounded_test_repository=True,
    )


def test_websocket_ticket_is_accepted_only_from_dedicated_subprotocol() -> None:
    value = ticket()
    assert ticket_from_subprotocol_header(f"other, atlas.voice.ticket.{value}") == (
        value,
        f"atlas.voice.ticket.{value}",
    )
    assert ticket_from_subprotocol_header("") == (None, None)
    assert ticket_from_subprotocol_header(f"ticket={value}") == (None, None)


def test_wrong_call_stream_or_version_does_not_consume_ticket() -> None:
    active = verifier()
    value = ticket()
    assert active.consume(value, "voice_call_other", "mock_stream_001", 3) == TicketReject(
        code="binding_mismatch"
    )
    assert active.consume(value, "voice_call_001", "mock_stream_other", 3) == TicketReject(
        code="binding_mismatch"
    )
    assert active.consume(value, "voice_call_001", "mock_stream_001", 2) == TicketReject(
        code="binding_mismatch"
    )
    assert isinstance(
        active.consume(value, "voice_call_001", "mock_stream_001", 3),
        SessionGrant,
    )


def test_replayed_or_tampered_ticket_is_rejected() -> None:
    active = verifier()
    value = ticket(nonce="media_ticket_nonce_0000000002")
    assert isinstance(
        active.consume(value, "voice_call_001", "mock_stream_001", 3),
        SessionGrant,
    )
    assert active.consume(value, "voice_call_001", "mock_stream_001", 3) == TicketReject(
        code="replay_rejected"
    )
    assert active.consume(f"{value}x", "voice_call_001", "mock_stream_001", 3) == TicketReject(
        code="ticket_invalid"
    )


def test_expired_and_disabled_tickets_fail_closed() -> None:
    expired = ticket(
        nonce="media_ticket_nonce_0000000003",
        issued_at=NOW - timedelta(seconds=40),
        expires_at=NOW - timedelta(seconds=1),
    )
    assert verifier().consume(
        expired, "voice_call_001", "mock_stream_001", 3
    ) == TicketReject(code="ticket_expired")
    assert verifier(enabled=False).consume(
        ticket(nonce="media_ticket_nonce_0000000004"),
        "voice_call_001",
        "mock_stream_001",
        3,
    ) == TicketReject(code="media_disabled")


def test_enabled_media_without_shared_or_explicit_test_store_fails_closed() -> None:
    active = SessionTicketVerifier(
        secret=SECRET,
        synthetic_media_enabled=True,
        clock=lambda: NOW,
    )
    assert active.consume(
        ticket(nonce="media_ticket_nonce_0000000005"),
        "voice_call_001",
        "mock_stream_001",
        3,
    ) == TicketReject(code="replay_store_unavailable")
