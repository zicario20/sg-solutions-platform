from collections.abc import Sequence

from fastapi import APIRouter, FastAPI

from app.api.inbound_calls import build_inbound_router
from app.composition.synthetic import (
    SyntheticVoiceComposition,
    default_synthetic_verifier,
)
from app.config import VoiceGatewaySettings
from app.runtime.admission import BoundedOperationRunner


def create_app(
    settings: VoiceGatewaySettings | None = None,
    routers: Sequence[APIRouter] = (),
    synthetic_composition: SyntheticVoiceComposition | None = None,
) -> FastAPI:
    active_settings = settings or VoiceGatewaySettings()
    app = FastAPI(
        title="Atlas Voice Gateway",
        version="0.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.state.settings = active_settings
    for router in routers:
        app.include_router(router)
    synthetic_verifier = (
        synthetic_composition.verifier
        if synthetic_composition is not None
        else default_synthetic_verifier()
    )
    app.include_router(
        build_inbound_router(
            synthetic_verifier,
            synthetic_composition.on_verified
            if synthetic_composition is not None
            else None,
            operation_runner=BoundedOperationRunner[str | None](
                capacity=active_settings.max_concurrent_operations,
                timeout_milliseconds=active_settings.max_operation_milliseconds,
            ),
        ),
        prefix="/__synthetic__",
    )

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
