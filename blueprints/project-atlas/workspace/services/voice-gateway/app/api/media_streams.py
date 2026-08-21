from __future__ import annotations

from fastapi import APIRouter, WebSocket

from app.security.session_ticket import SessionTicketVerifier, TicketReject

_SUBPROTOCOL_PREFIX = "atlas.voice.ticket."


def _ticket_from_websocket(websocket: WebSocket) -> tuple[str | None, str | None]:
    protocols = websocket.headers.get("sec-websocket-protocol", "")
    for protocol in (item.strip() for item in protocols.split(",")):
        if protocol.startswith(_SUBPROTOCOL_PREFIX):
            return protocol.removeprefix(_SUBPROTOCOL_PREFIX), protocol
    return websocket.query_params.get("ticket"), None


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
