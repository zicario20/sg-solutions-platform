from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
import base64
import hashlib
import hmac
import json
import re
from typing import Literal, cast

from app.security.replay_repository import (
    AtomicNonceRepository,
    UnavailableAtomicNonceRepository,
)

TicketRejectCode = Literal[
    "media_disabled",
    "ticket_invalid",
    "ticket_expired",
    "binding_mismatch",
    "replay_rejected",
    "replay_store_unavailable",
]

_ISSUER = "atlas-platform"
_AUDIENCE = "voice-media-gateway"
_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$")
_NONCE = re.compile(r"^[A-Za-z0-9_-]{24,128}$")
_MAX_TICKET_MILLISECONDS = 60_000
_CLOCK_SKEW_MILLISECONDS = 5_000
_MAX_TOKEN_BYTES = 2_048


@dataclass(frozen=True, slots=True)
class TicketReject:
    code: TicketRejectCode


@dataclass(frozen=True, slots=True)
class SessionGrant:
    call_id: str
    provider_stream_id: str
    authorization_version: int
    expires_at: datetime


def _secret_bytes(secret: bytes) -> bytes:
    if len(secret) < 32:
        raise ValueError("SESSION_TICKET_SECRET_TOO_SHORT")
    return bytes(secret)


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _signature(body: str, secret: bytes) -> str:
    return _encode(hmac.new(secret, f"v1.{body}".encode(), hashlib.sha256).digest())


def issue_synthetic_session_ticket(
    *,
    secret: bytes,
    call_id: str,
    provider_stream_id: str,
    authorization_version: int,
    nonce: str,
    issued_at: datetime,
    expires_at: datetime,
) -> str:
    if (
        not _ID.fullmatch(call_id)
        or not _ID.fullmatch(provider_stream_id)
        or not _NONCE.fullmatch(nonce)
        or authorization_version <= 0
        or expires_at <= issued_at
        or (expires_at - issued_at).total_seconds() * 1_000 > _MAX_TICKET_MILLISECONDS
    ):
        raise ValueError("SESSION_TICKET_INPUT_INVALID")
    claims = {
        "audience": _AUDIENCE,
        "authorizationVersion": authorization_version,
        "callId": call_id,
        "expiresAt": int(expires_at.timestamp() * 1_000),
        "issuedAt": int(issued_at.timestamp() * 1_000),
        "issuer": _ISSUER,
        "nonce": nonce,
        "providerStreamId": provider_stream_id,
        "version": 1,
    }
    body = _encode(
        json.dumps(claims, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    secret_value = _secret_bytes(secret)
    return f"v1.{body}.{_signature(body, secret_value)}"


class SessionTicketVerifier:
    def __init__(
        self,
        *,
        secret: bytes,
        synthetic_media_enabled: bool = False,
        clock: Callable[[], datetime] = lambda: datetime.now(tz=UTC),
        nonce_repository: AtomicNonceRepository | None = None,
        allow_bounded_test_repository: bool = False,
    ) -> None:
        self._secret = _secret_bytes(secret)
        self._enabled = synthetic_media_enabled
        self._clock = clock
        self._nonces = nonce_repository or UnavailableAtomicNonceRepository()
        self._nonce_repository_ready = self._nonces.durability == "shared_durable" or (
            allow_bounded_test_repository
            and self._nonces.durability == "bounded_test"
        )

    def consume(
        self,
        ticket: str,
        call_id: str,
        provider_stream_id: str | None = None,
        authorization_version: int | None = None,
    ) -> SessionGrant | TicketReject:
        if not self._enabled:
            return TicketReject(code="media_disabled")
        claims = self._parse(ticket)
        if claims is None:
            return TicketReject(code="ticket_invalid")
        now_ms = int(self._clock().timestamp() * 1_000)
        issued_at = claims["issuedAt"]
        expires_at = claims["expiresAt"]
        if (
            issued_at > now_ms + _CLOCK_SKEW_MILLISECONDS
            or expires_at <= now_ms
            or expires_at <= issued_at
            or expires_at - issued_at > _MAX_TICKET_MILLISECONDS
        ):
            return TicketReject(code="ticket_expired")
        if (
            claims["callId"] != call_id
            or (
                provider_stream_id is not None
                and claims["providerStreamId"] != provider_stream_id
            )
            or (
                authorization_version is not None
                and claims["authorizationVersion"] != authorization_version
            )
        ):
            return TicketReject(code="binding_mismatch")
        if not self._nonce_repository_ready:
            return TicketReject(code="replay_store_unavailable")
        nonce = cast(str, claims["nonce"])
        expires_at_value = datetime.fromtimestamp(expires_at / 1_000, tz=UTC)
        try:
            replay = self._nonces.consume(
                "voice_media_session",
                ":".join(
                    (
                        cast(str, claims["callId"]),
                        cast(str, claims["providerStreamId"]),
                        str(cast(int, claims["authorizationVersion"])),
                        nonce,
                    )
                ),
                expires_at_value,
                self._clock(),
            )
        except Exception:
            replay = "unavailable"
        if replay == "replay":
            return TicketReject(code="replay_rejected")
        if replay != "consumed":
            return TicketReject(code="replay_store_unavailable")
        return SessionGrant(
            call_id=claims["callId"],
            provider_stream_id=claims["providerStreamId"],
            authorization_version=claims["authorizationVersion"],
            expires_at=expires_at_value,
        )

    def _parse(self, ticket: str) -> dict[str, object] | None:
        if len(ticket.encode("utf-8")) > _MAX_TOKEN_BYTES:
            return None
        parts = ticket.split(".")
        if len(parts) != 3 or parts[0] != "v1":
            return None
        body, supplied = parts[1], parts[2]
        if not body or not supplied or not hmac.compare_digest(
            _signature(body, self._secret), supplied
        ):
            return None
        try:
            parsed = json.loads(_decode(body))
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            return None
        if not isinstance(parsed, dict):
            return None
        expected_keys = {
            "audience",
            "authorizationVersion",
            "callId",
            "expiresAt",
            "issuedAt",
            "issuer",
            "nonce",
            "providerStreamId",
            "version",
        }
        if set(parsed) != expected_keys:
            return None
        if (
            parsed.get("version") != 1
            or parsed.get("issuer") != _ISSUER
            or parsed.get("audience") != _AUDIENCE
            or not isinstance(parsed.get("callId"), str)
            or not _ID.fullmatch(cast(str, parsed["callId"]))
            or not isinstance(parsed.get("providerStreamId"), str)
            or not _ID.fullmatch(cast(str, parsed["providerStreamId"]))
            or not isinstance(parsed.get("authorizationVersion"), int)
            or cast(int, parsed["authorizationVersion"]) <= 0
            or not isinstance(parsed.get("nonce"), str)
            or not _NONCE.fullmatch(cast(str, parsed["nonce"]))
            or not isinstance(parsed.get("issuedAt"), int)
            or not isinstance(parsed.get("expiresAt"), int)
        ):
            return None
        return parsed
