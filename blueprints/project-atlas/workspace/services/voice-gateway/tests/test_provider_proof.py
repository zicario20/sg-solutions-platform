from dataclasses import replace
from datetime import UTC, datetime
from hashlib import sha256

from app.security.provider_proof import (
    ProviderConnectionBinding,
    ProviderProofVerifier,
    ProviderRequest,
    ProviderReject,
    VerifiedProviderRequest,
    sign_synthetic_provider_request,
)
from app.security.replay_repository import BoundedMemoryAtomicNonceRepository

NOW = datetime(2026, 8, 20, 12, 0, tzinfo=UTC)
SECRET = b"synthetic-provider-proof-secret-000000000000000000000000"
ACCOUNT_DIGEST = "a" * 64
NUMBER_DIGEST = "b" * 64


def request(*, body: bytes = b'{"event":"synthetic"}', nonce: str = "provider_nonce_000000000001") -> ProviderRequest:
    timestamp = str(int(NOW.timestamp()))
    signature = sign_synthetic_provider_request(
        secret=SECRET,
        timestamp=timestamp,
        nonce=nonce,
        connection_id="mock_connection",
        account_binding_digest=ACCOUNT_DIGEST,
        number_binding_digest=NUMBER_DIGEST,
        body=body,
    )
    return ProviderRequest(
        method="POST",
        content_type="application/json",
        content_encoding=None,
        connection_id="mock_connection",
        account_binding_digest=ACCOUNT_DIGEST,
        number_binding_digest=NUMBER_DIGEST,
        timestamp=timestamp,
        nonce=nonce,
        signature=signature,
        body=body,
    )


def verifier(*, enabled: bool = True) -> ProviderProofVerifier:
    return ProviderProofVerifier(
        secret=SECRET,
        connections={
            "mock_connection": ProviderConnectionBinding(
                connection_id="mock_connection",
                state="synthetic_verified",
                account_binding_digest=ACCOUNT_DIGEST,
                number_binding_digest=NUMBER_DIGEST,
            )
        },
        synthetic_admission_enabled=enabled,
        clock=lambda: NOW,
        nonce_repository=BoundedMemoryAtomicNonceRepository(capacity=8),
        allow_bounded_test_repository=True,
    )


def test_disabled_admission_rejects_before_request_validation() -> None:
    malformed = ProviderRequest(
        method="INVALID",
        content_type="text/plain",
        content_encoding="gzip",
        connection_id="missing",
        account_binding_digest="invalid",
        number_binding_digest="invalid",
        timestamp="invalid",
        nonce="invalid",
        signature="invalid",
        body=b"not-json",
    )
    result = verifier(enabled=False).verify(malformed)
    assert isinstance(result, ProviderReject)
    assert result.code == "provider_disabled"


def test_exact_body_and_active_bindings_are_verified_without_json_parsing() -> None:
    malformed_json = request(body=b"{synthetic-but-not-json")
    result = verifier().verify(malformed_json)
    assert isinstance(result, VerifiedProviderRequest)
    assert result.body == b"{synthetic-but-not-json"
    assert result.body_digest == sha256(malformed_json.body).hexdigest()


def test_tamper_binding_mismatch_and_replay_fail_closed() -> None:
    active = verifier()
    signed = request()
    tampered = replace(signed, body=b'{"event":"tampered"}')
    wrong_binding = replace(signed, account_binding_digest="c" * 64)
    assert active.verify(tampered) == ProviderReject(code="proof_invalid")
    assert active.verify(wrong_binding) == ProviderReject(code="binding_mismatch")
    assert isinstance(active.verify(signed), VerifiedProviderRequest)
    assert active.verify(signed) == ProviderReject(code="replay_rejected")


def test_encoding_and_size_are_rejected_before_proof_work() -> None:
    signed = request()
    encoded = replace(signed, content_encoding="gzip")
    oversized = request(body=b"x" * 65_537, nonce="provider_nonce_000000000002")
    assert verifier().verify(encoded) == ProviderReject(code="content_encoding_rejected")
    assert verifier().verify(oversized) == ProviderReject(code="body_too_large")


def test_enabled_provider_without_shared_or_explicit_test_store_fails_closed() -> None:
    active = ProviderProofVerifier(
        secret=SECRET,
        connections={
            "mock_connection": ProviderConnectionBinding(
                connection_id="mock_connection",
                state="synthetic_verified",
                account_binding_digest=ACCOUNT_DIGEST,
                number_binding_digest=NUMBER_DIGEST,
            )
        },
        synthetic_admission_enabled=True,
        clock=lambda: NOW,
    )
    assert active.verify(
        request(nonce="provider_nonce_no_store_000001")
    ) == ProviderReject(code="replay_store_unavailable")
