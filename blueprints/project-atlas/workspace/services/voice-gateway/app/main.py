from fastapi import FastAPI

from app.config import VoiceGatewaySettings


def create_app(settings: VoiceGatewaySettings | None = None) -> FastAPI:
    active_settings = settings or VoiceGatewaySettings()
    app = FastAPI(
        title="Atlas Voice Gateway",
        version="0.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.state.settings = active_settings

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {
            "service": "voice-gateway",
            "status": "ok",
            "provider_mode": active_settings.provider_mode,
            "external_admission": "disabled",
            "recording": "disabled",
            "transcription": "disabled",
        }

    return app


app = create_app()
