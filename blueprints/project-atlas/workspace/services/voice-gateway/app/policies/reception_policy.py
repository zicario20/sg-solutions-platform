from __future__ import annotations

import re
import unicodedata
from typing import Literal

VoiceLocale = Literal["es", "en"]
ReceptionIntent = Literal[
    "affirm",
    "cancel",
    "appointment",
    "callback",
    "message",
    "human",
    "public_information",
    "protected_request",
    "prohibited_request",
    "unknown",
]

_SPACE = re.compile(r"\s+")


def _normalized(value: str) -> str:
    return _SPACE.sub(
        " ",
        unicodedata.normalize("NFKC", value).casefold().strip(),
    )


class ReceptionPolicy:
    _protected = (
        "account number",
        "numero de cuenta",
        "número de cuenta",
        "social security",
        "seguro social",
        "ssn",
        "itin",
        "card number",
        "numero de tarjeta",
        "número de tarjeta",
        "bank account",
        "cuenta bancaria",
        "password",
        "contraseña",
        "case status",
        "estado de mi caso",
        "payment status",
        "estado de pago",
        "missing documents",
        "documentos faltantes",
    )
    _prohibited = (
        "file my taxes",
        "presentes mis impuestos",
        "presentar mis impuestos",
        "dispute my credit",
        "disputar mi credito",
        "disputar mi crédito",
        "apply for a loan",
        "solicitar un prestamo",
        "solicitar un préstamo",
        "apply for a credit card",
        "solicitar una tarjeta",
        "form my llc",
        "formar mi llc",
        "sign for me",
        "firma por mi",
        "refund my payment",
        "reembolsa mi pago",
    )
    _appointments = (
        "appointment",
        "cita",
        "schedule",
        "agendar",
    )
    _callbacks = (
        "call me back",
        "callback",
        "devuelvan la llamada",
        "llamenme",
        "llámenme",
    )
    _messages = (
        "leave a message",
        "take a message",
        "dejar un mensaje",
        "tomar un mensaje",
    )
    _human = (
        "human",
        "person",
        "representative",
        "humano",
        "persona",
        "representante",
    )
    _public_information = (
        "what services",
        "services do you offer",
        "que servicios",
        "qué servicios",
        "public information",
        "informacion general",
        "información general",
    )

    def select_language(self, turn: str) -> VoiceLocale | None:
        value = _normalized(turn)
        if value in {"english", "ingles", "inglés", "2"}:
            return "en"
        if value in {"spanish", "espanol", "español", "1"}:
            return "es"
        return None

    def classify(self, turn: str, locale: VoiceLocale) -> ReceptionIntent:
        del locale
        value = _normalized(turn)
        if not value or len(value) > 512:
            return "unknown"
        if any(fragment in value for fragment in self._protected):
            return "protected_request"
        if any(fragment in value for fragment in self._prohibited):
            return "prohibited_request"
        if value in {"yes", "yes please", "si", "sí", "confirm", "confirmo"}:
            return "affirm"
        if value in {"no", "cancel", "cancelar", "no gracias", "no thanks"}:
            return "cancel"
        if any(fragment in value for fragment in self._appointments):
            return "appointment"
        if any(fragment in value for fragment in self._callbacks):
            return "callback"
        if any(fragment in value for fragment in self._messages):
            return "message"
        if any(fragment in value for fragment in self._human):
            return "human"
        if any(fragment in value for fragment in self._public_information):
            return "public_information"
        return "unknown"
