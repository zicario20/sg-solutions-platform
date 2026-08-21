from __future__ import annotations

_SUBPROTOCOL_PREFIX = "atlas.voice.ticket."


def ticket_from_subprotocol_header(value: str) -> tuple[str | None, str | None]:
    for protocol in (item.strip() for item in value.split(",")):
        if protocol.startswith(_SUBPROTOCOL_PREFIX):
            ticket = protocol.removeprefix(_SUBPROTOCOL_PREFIX)
            return (ticket, protocol) if ticket else (None, None)
    return None, None
