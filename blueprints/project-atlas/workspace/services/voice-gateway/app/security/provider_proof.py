from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
import hmac
import re
from threading import Lock
from typing import Literal

ConnectionState = Literal["disabled", "synthetic_verified"]
ProviderRejectCode = Literal[
    "provider_disabled",
    "connection_unavailable",
    "binding_mismatch",
    "method_rejected",
    "content_type_rejected",
    "content_encoding_rejected",
    "body_too_large",
    "proof_invalid",
    "proof_expired",
    "replay_rejected",
]

_DIGEST = re.compile(r"^[0-9a-f]{64}$")
_NONCE = re.compile(r"^[A-Za-z0-9_-]{24,128}$")
_SIGNATURE = re.compile(r"^[0-9a-f]{64}$")
_MAX_CLOCK_SKEW_SECONDS = 300
_MAX_BODY_BYTES = 65_536


@dataclass(frozen=True, slots=True)
class ProviderConnectionBinding:
    connection_id: str
    state: ConnectionState
    account_binding_digest: str
    number_binding_digest: str


@dataclass(frozen=True, slots=True)
class ProviderRequest:
    method: str
    content_type: str | None
    content_encoding: str | None
    connection_id: str
    account_binding_digest: str
    number_binding_digest: str
    timestamp: str
    nonce: str
    signature: str
    body: bytes


@dataclass(frozen=True, slots=True)
class ProviderReject:
    code: ProviderRejectCode


@dataclass(frozen=True, slots=True)
class VerifiedProviderRequest:
    connection_id: str
    body: bytes
    body_digest: str
    nonce: str
    verified_at: datetime


def _secret_bytes(secret: bytes) -> bytes:
    if len(secret) < 32:
        raise ValueError("PROVIDER_PROOF_SECRET_TOO_SHORT")
    return bytes(secret)


def _canonical(
    *,
    timestamp: str,
    nonce: str,
    connection_id: str,
    account_binding_digest: str,
    number_binding_digest: str,
    body_digest: str,
) -> bytes:
    return "\n".join(
        (
            "atlas-mock-provider.v1",
            timestamp,
            nonce,
            connection_id,
            account_binding_digest,
            number_binding_digest,
            body_digest,
        )
    ).encode("utf-8")


def sign_synthetic_provider_request(
    *,
    secret: bytes,
    timestamp: str,
    nonce: str,
    connection_id: str,
    account_binding_digest: str,
    number_binding_digest: str,
    body: bytes,
) -> str:
    digest = sha256(body).hexdigest()
    return hmac.new(
        _secret_bytes(secret),
        _canonical(
            timestamp=timestamp,
            nonce=nonce,
            connection_id=connection_id,
            account_binding_digest=account_binding_digest,
            number_binding_digest=number_binding_digest,
            body_digest=digest,
        ),
        "sha256",
    ).hexdigest()


class ProviderProofVerifier:
    max_body_bytes = _MAX_BODY_BYTES

    def __init__(
        self,
        *,
        secret: bytes,
        connections: Mapping[str, ProviderConnectionBinding],
        synthetic_admission_enabled: bool = False,
        clock: Callable[[], datetime] = lambda: datetime.now(tz=UTC),
    ) -> None:
        self._secret = _secret_bytes(secret)
        self._connections = dict(connections)
        self._enabled = synthetic_admission_enabled
        self._clock = clock
        self._consumed_nonces: set[str] = set()
        self._nonce_lock = Lock()

    def preflight(
        self, request: ProviderRequest
    ) -> ProviderConnectionBinding | ProviderReject:
        if not self._enabled:
            return ProviderReject(code="provider_disabled")
        connection = self._connections.get(request.connection_id)
        if connection is None or connection.state != "synthetic_verified":
            return ProviderReject(code="connection_unavailable")
        if (
            not _DIGEST.fullmatch(connection.account_binding_digest)
            or not _DIGEST.fullmatch(connection.number_binding_digest)
            or request.account_binding_digest != connection.account_binding_digest
            or request.number_binding_digest != connection.number_binding_digest
        ):
            return ProviderReject(code="binding_mismatch")
        if request.method != "POST":
            return ProviderReject(code="method_rejected")
        if request.content_type != "application/json":
            return ProviderReject(code="content_type_rejected")
        if request.content_encoding not in (None, ""):
            return ProviderReject(code="content_encoding_rejected")
        return connection

    def verify(self, request: ProviderRequest) -> VerifiedProviderRequest | ProviderReject:
        preflight = self.preflight(request)
        if isinstance(preflight, ProviderReject):
            return preflight
        if not isinstance(request.body, bytes) or len(request.body) > self.max_body_bytes:
            return ProviderReject(code="body_too_large")
        if (
            not _NONCE.fullmatch(request.nonce)
            or not _SIGNATURE.fullmatch(request.signature)
        ):
            return ProviderReject(code="proof_invalid")
        try:
            timestamp = int(request.timestamp)
        except ValueError:
            return ProviderReject(code="proof_invalid")
        if str(timestamp) != request.timestamp:
            return ProviderReject(code="proof_invalid")
        now = self._clock()
        if abs(int(now.timestamp()) - timestamp) > _MAX_CLOCK_SKEW_SECONDS:
            return ProviderReject(code="proof_expired")
        body_digest = sha256(request.body).hexdigest()
        expected = hmac.new(
            self._secret,
            _canonical(
                timestamp=request.timestamp,
                nonce=request.nonce,
                connection_id=request.connection_id,
                account_binding_digest=request.account_binding_digest,
                number_binding_digest=request.number_binding_digest,
                body_digest=body_digest,
            ),
            "sha256",
        ).hexdigest()
        if not hmac.compare_digest(expected, request.signature):
            return ProviderReject(code="proof_invalid")
        with self._nonce_lock:
            if request.nonce in self._consumed_nonces:
                return ProviderReject(code="replay_rejected")
            self._consumed_nonces.add(request.nonce)
        return VerifiedProviderRequest(
            connection_id=request.connection_id,
            body=request.body,
            body_digest=body_digest,
            nonce=request.nonce,
            verified_at=now,
        )
