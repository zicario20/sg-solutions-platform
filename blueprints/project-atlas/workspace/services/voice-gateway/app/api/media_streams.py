from __future__ import annotations

from fastapi import APIRouter, WebSocket

from app.security.session_ticket import SessionTicketVerifier, TicketReject
from app.security.websocket_protocol import ticket_from_subprotocol_header


def _ticket_from_websocket(websocket: WebSocket) -> tuple[str | None, str | None]:
    return ticket_from_subprotocol_header(
        websocket.headers.get("sec-websocket-protocol", "")
    )


def build_media_router(verifier: SessionTicketVerifier) -> APIRouter:
    router = APIRouter()

    @router.websocket("/v1/media")
    async def media(websocket: WebSocket) -> None:
        ticket, accepted_subprotocol = _ticket_from_websocket(websocket)
        call_id = websocket.query_params.get("call_id", "")
        provider_stream_id = websocket.query_params.get("stream_id", "")
        try:
            authorization_version = int(
                websocket.query_params.get("authorization_version", "0")
            )
        except ValueError:
            authorization_version = 0
        if not ticket:
            await websocket.close(code=1008)
            return
        grant = verifier.consume(
            ticket,
            call_id,
            provider_stream_id,
            authorization_version,
        )
        if isinstance(grant, TicketReject):
            await websocket.close(code=1008)
            return
        await websocket.accept(subprotocol=accepted_subprotocol)
        await websocket.send_json(
            {
                "status": "synthetic_session_admitted",
                "call_id": grant.call_id,
                "authorization_version": grant.authorization_version,
            }
        )
        await websocket.close(code=1000)

    return router
