from datetime import UTC, datetime, timedelta

from app.security.replay_repository import (
    BoundedMemoryAtomicNonceRepository,
    UnavailableAtomicNonceRepository,
)

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)


def test_bounded_store_enforces_one_time_capacity_and_ttl_cleanup() -> None:
    store = BoundedMemoryAtomicNonceRepository(capacity=2)
    expiry = NOW + timedelta(seconds=30)

    assert store.consume("provider", "nonce-1", expiry, NOW) == "consumed"
    assert store.consume("provider", "nonce-1", expiry, NOW) == "replay"
    assert store.consume("media", "nonce-2", expiry, NOW) == "consumed"
    assert store.consume("provider", "nonce-3", expiry, NOW) == "capacity"

    after_expiry = expiry + timedelta(microseconds=1)
    assert store.consume(
        "provider",
        "nonce-3",
        after_expiry + timedelta(seconds=30),
        after_expiry,
    ) == "consumed"
    assert store.entry_count == 1
    assert store.durability == "bounded_test"


def test_unavailable_store_always_fails_closed() -> None:
    store = UnavailableAtomicNonceRepository()
    assert store.consume(
        "provider",
        "nonce-1",
        NOW + timedelta(seconds=30),
        NOW,
    ) == "unavailable"
