from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import VoiceGatewaySettings
from app.main import create_app


def test_health_reports_mock_only_provider_disabled_posture() -> None:
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "service": "voice-gateway",
        "status": "ok",
        "provider_mode": "mock",
        "external_admission": "disabled",
        "recording": "disabled",
        "transcription": "disabled",
    }


def test_default_settings_do_not_expose_external_inbound_admission() -> None:
    client = TestClient(create_app())

    assert client.post("/v1/inbound").status_code == 404


def test_external_recording_and_transcription_flags_cannot_be_enabled() -> None:
    for field in (
        "external_admission_enabled",
        "recording_enabled",
        "transcription_enabled",
        "database_access_enabled",
    ):
        try:
            VoiceGatewaySettings(**{field: True})
        except ValidationError:
            continue
        raise AssertionError(f"{field} must remain fail-closed")
