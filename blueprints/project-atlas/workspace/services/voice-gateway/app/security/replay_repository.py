from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from hashlib import sha256
import re
from threading import Lock
from typing import Literal, Protocol

ReplayResult = Literal["consumed", "replay", "capacity", "unavailable"]
ReplayDurability = Literal["shared_durable", "bounded_test", "unavailable"]

_NAMESPACE = re.compile(r"^[a-z][a-z0-9_.:-]{2,63}$")
_MAX_TOKEN_BYTES = 4_096
_MAX_TEST_CAPACITY = 100_000


class AtomicNonceRepository(Protocol):
    durability: ReplayDurability

    def consume(
        self,
        namespace: str,
        token: str,
        expires_at: datetime,
        now: datetime,
    ) -> ReplayResult: ...


class SharedNonceTransport(Protocol):
    def consume_atomic_nonce(
        self,
        namespace: str,
        token_digest: str,
        expires_at: datetime,
        now: datetime,
    ) -> ReplayResult: ...


class UnavailableAtomicNonceRepository:
    durability: ReplayDurability = "unavailable"

    def consume(
        self,
        namespace: str,
        token: str,
        expires_at: datetime,
        now: datetime,
    ) -> ReplayResult:
        del namespace, token, expires_at, now
        return "unavailable"


class FacadeAtomicNonceRepository:
    """Shared backend adapter; Python never receives database access."""

    durability: ReplayDurability = "shared_durable"

    def __init__(self, transport: SharedNonceTransport) -> None:
        self._transport = transport

    def consume(
        self,
        namespace: str,
        token: str,
        expires_at: datetime,
        now: datetime,
    ) -> ReplayResult:
        if not _valid_input(namespace, token, expires_at, now):
            return "unavailable"
        token_digest = sha256(f"{namespace}\0{token}".encode()).hexdigest()
        try:
            result = self._transport.consume_atomic_nonce(
                namespace,
                token_digest,
                expires_at,
                now,
            )
        except Exception:
            return "unavailable"
        return result if result in {"consumed", "replay", "capacity"} else "unavailable"


def _valid_input(
    namespace: str,
    token: str,
    expires_at: datetime,
    now: datetime,
) -> bool:
    return (
        bool(_NAMESPACE.fullmatch(namespace))
        and 0 < len(token.encode("utf-8")) <= _MAX_TOKEN_BYTES
        and expires_at.tzinfo is not None
        and now.tzinfo is not None
        and expires_at > now
    )


class BoundedMemoryAtomicNonceRepository:
    """Deterministic provider-disabled test store; not restart/cross-worker safe."""

    durability: ReplayDurability = "bounded_test"

    def __init__(self, *, capacity: int) -> None:
        if not 1 <= capacity <= _MAX_TEST_CAPACITY:
            raise ValueError("REPLAY_CAPACITY_INVALID")
        self._capacity = capacity
        self._entries: dict[str, datetime] = {}
        self._lock = Lock()

    @property
    def entry_count(self) -> int:
        with self._lock:
            return len(self._entries)

    def consume(
        self,
        namespace: str,
        token: str,
        expires_at: datetime,
        now: datetime,
    ) -> ReplayResult:
        if not _valid_input(namespace, token, expires_at, now):
            return "unavailable"
        key = sha256(f"{namespace}\0{token}".encode()).hexdigest()
        with self._lock:
            expired = [entry for entry, expiry in self._entries.items() if expiry <= now]
            for entry in expired:
                del self._entries[entry]
            if key in self._entries:
                return "replay"
            if len(self._entries) >= self._capacity:
                return "capacity"
            self._entries[key] = expires_at
            return "consumed"
