from typing import Literal

from pydantic import BaseModel, ConfigDict


class VoiceGatewaySettings(BaseModel):
    """Immutable settings that cannot activate external voice behavior."""

    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)

    provider_mode: Literal["mock"] = "mock"
    external_admission_enabled: Literal[False] = False
    recording_enabled: Literal[False] = False
    transcription_enabled: Literal[False] = False
    database_access_enabled: Literal[False] = False
    max_operation_milliseconds: int = 5_000
    max_concurrent_operations: int = 4
