const sharedKeys = {
  quickActions: {
    services: "",
    credit: "",
    taxes: "",
    business: "",
    homeBuying: "",
    human: "",
  },
  errors: {
    invalidMessage: "",
    sensitiveData: "",
    temporarilyUnavailable: "",
    sessionExpired: "",
    conflict: "",
    responseNotRetained: "",
  },
};

type PublicChatCopy = {
  notice: string;
  greeting: string;
  quickActions: Record<keyof typeof sharedKeys.quickActions, string>;
  errors: Record<keyof typeof sharedKeys.errors, string>;
  handoff: { requested: string; queued: string; unavailable: string };
  orientation: { matches: string; noMatch: string };
  ui: {
    launcher: string;
    title: string;
    automated: string;
    close: string;
    language: string;
    acknowledge: string;
    start: string;
    placeholder: string;
    send: string;
    sending: string;
    statusReady: string;
    sources: string;
    helpCenter: string;
    fullPage: string;
    newConversation: string;
    characterCount: string;
  };
};

export const PUBLIC_CHAT_COPY: Record<"es" | "en", PublicChatCopy> = {
  es: {
    notice:
      "Soy un asistente automatizado de orientación general. No envíes números de identificación, tarjetas, cuentas, contraseñas ni documentos. El chat no sustituye asesoría profesional ni garantiza resultados.",
    greeting: "Hola. Puedo ayudarte a encontrar servicios y recursos públicos de SG Solutions.",
    quickActions: {
      services: "Ver servicios",
      credit: "Orientación sobre crédito",
      taxes: "Información sobre taxes",
      business: "Formación y financiamiento empresarial",
      homeBuying: "Preparación para comprar vivienda",
      human: "Hablar con una persona",
    },
    errors: {
      invalidMessage: "Revisa el mensaje e inténtalo de nuevo.",
      sensitiveData: "No envíes información sensible por este chat.",
      temporarilyUnavailable: "La orientación automática no está disponible temporalmente.",
      sessionExpired: "Esta sesión terminó. Puedes iniciar una conversación nueva.",
      conflict: "La conversación cambió. Actualízala antes de continuar.",
      responseNotRetained:
        "La respuesta anterior no se conserva por privacidad y no pudo recuperarse. Puedes enviar la pregunta de nuevo.",
    },
    handoff: {
      requested: "Tu solicitud de atención humana está pendiente de confirmación.",
      queued: "La solicitud fue recibida. Esto no confirma una hora de respuesta.",
      unavailable: "No pudimos confirmar la solicitud. Usa la página de contacto.",
    },
    orientation: {
      matches: "Encontré estos recursos públicos que pueden orientarte:",
      noMatch:
        "No encontré una respuesta pública vigente para esa pregunta. Puedes explorar el Centro de Ayuda o solicitar atención humana.",
    },
    ui: {
      launcher: "Abrir asistente de SG Solutions",
      title: "Asistente de SG Solutions",
      automated: "Asistente automatizado",
      close: "Cerrar chat",
      language: "English",
      acknowledge: "Entiendo y acepto estas condiciones para comenzar.",
      start: "Empezar conversación",
      placeholder: "Escribe tu pregunta sin información sensible",
      send: "Enviar",
      sending: "Enviando…",
      statusReady: "Listo para ayudarte.",
      sources: "Fuentes públicas",
      helpCenter: "Visitar el Centro de Ayuda",
      fullPage: "Abrir chat en página completa",
      newConversation: "Nueva conversación",
      characterCount: "caracteres disponibles",
    },
  },
  en: {
    notice:
      "I am an automated general-orientation assistant. Do not send identification, card, account, password, or document data. Chat does not replace professional advice or guarantee results.",
    greeting: "Hello. I can help you find SG Solutions services and public resources.",
    quickActions: {
      services: "View services",
      credit: "Credit orientation",
      taxes: "Tax information",
      business: "Business formation and funding",
      homeBuying: "Home-buying preparation",
      human: "Talk to a person",
    },
    errors: {
      invalidMessage: "Review the message and try again.",
      sensitiveData: "Do not send sensitive information through this chat.",
      temporarilyUnavailable: "Automated orientation is temporarily unavailable.",
      sessionExpired: "This session ended. You can start a new conversation.",
      conflict: "The conversation changed. Refresh it before continuing.",
      responseNotRetained:
        "For privacy, the previous answer is not retained and could not be recovered. You can send the question again.",
    },
    handoff: {
      requested: "Your human-support request is awaiting confirmation.",
      queued: "The request was received. This does not confirm a response time.",
      unavailable: "We could not confirm the request. Use the contact page.",
    },
    orientation: {
      matches: "I found these public resources that may help orient you:",
      noMatch:
        "I could not find a current public answer for that question. You can explore the Help Center or request human support.",
    },
    ui: {
      launcher: "Open the SG Solutions assistant",
      title: "SG Solutions Assistant",
      automated: "Automated assistant",
      close: "Close chat",
      language: "Español",
      acknowledge: "I understand and accept these conditions to begin.",
      start: "Start conversation",
      placeholder: "Write your question without sensitive information",
      send: "Send",
      sending: "Sending…",
      statusReady: "Ready to help.",
      sources: "Public sources",
      helpCenter: "Visit the Help Center",
      fullPage: "Open chat on a full page",
      newConversation: "New conversation",
      characterCount: "characters available",
    },
  },
};
