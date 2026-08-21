from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import replace

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.security.provider_proof import (
    ProviderProofVerifier,
    ProviderReject,
    ProviderRequest,
    VerifiedProviderRequest,
)

VerifiedInboundHandler = Callable[[VerifiedProviderRequest], Awaitable[str | None]]


def _request_shell(request: Request) -> ProviderRequest:
    headers = request.headers
    return ProviderRequest(
        method=request.method,
        content_type=headers.get("content-type"),
        content_encoding=headers.get("content-encoding"),
        connection_id=headers.get("x-atlas-connection-id", ""),
        account_binding_digest=headers.get("x-atlas-account-binding", ""),
        number_binding_digest=headers.get("x-atlas-number-binding", ""),
        timestamp=headers.get("x-atlas-provider-timestamp", ""),
        nonce=headers.get("x-atlas-provider-nonce", ""),
        signature=headers.get("x-atlas-provider-signature", ""),
        body=b"",
    )


async def _read_bounded_body(request: Request, maximum: int) -> bytes:
    body = bytearray()
    async with asyncio.timeout(2):
        async for chunk in request.stream():
            if len(body) + len(chunk) > maximum:
                raise ValueError("body_too_large")
            body.extend(chunk)
    return bytes(body)


def build_inbound_router(
    verifier: ProviderProofVerifier,
    on_verified: VerifiedInboundHandler | None = None,
) -> APIRouter:
    router = APIRouter()

    @router.post("/v1/inbound", include_in_schema=False)
    async def inbound(request: Request) -> JSONResponse:
        shell = _request_shell(request)
        preflight = verifier.preflight(shell)
        if isinstance(preflight, ProviderReject):
            status = 404 if preflight.code == "provider_disabled" else 401
            return JSONResponse(status_code=status, content={"status": "rejected"})
        try:
            body = await _read_bounded_body(request, verifier.max_body_bytes)
        except (TimeoutError, ValueError):
            return JSONResponse(status_code=413, content={"status": "rejected"})
        verified = verifier.verify(replace(shell, body=body))
        if isinstance(verified, ProviderReject):
            return JSONResponse(status_code=401, content={"status": "rejected"})
        if on_verified is None:
            return JSONResponse(status_code=503, content={"status": "platform_unavailable"})
        receipt_id = await on_verified(verified)
        if not receipt_id:
            return JSONResponse(status_code=503, content={"status": "platform_unavailable"})
        return JSONResponse(status_code=202, content={"status": "accepted"})

    return router
