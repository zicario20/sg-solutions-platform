import type { DashboardLocale } from "@atlas/dashboard";

export type DocumentCopy = Readonly<{
  title: string;
  eyebrow: string;
  intro: string;
  allowedTitle: string;
  allowedBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  emptyTitle: string;
  emptyBody: string;
  upload: string;
  received: string;
  processing: string;
  correction: string;
  legalHold: string;
}>;

export const documentCopy: Readonly<Record<DashboardLocale, DocumentCopy>> = Object.freeze({
  es: {
    title: "Documentos",
    eyebrow: "Portal seguro",
    intro: "Revisa solicitudes y comparte documentos mediante un canal protegido.",
    allowedTitle: "Antes de cargar",
    allowedBody:
      "Aceptamos PDF, JPG y PNG de hasta 25 MB. No envíes contraseñas, números completos de cuenta ni información sensible por otros canales.",
    unavailableTitle: "Las cargas seguras no están disponibles ahora",
    unavailableBody:
      "Tus documentos no se han enviado. Inténtalo de nuevo más tarde o comunícate con SG Solutions.",
    emptyTitle: "No tienes documentos pendientes",
    emptyBody: "Cuando necesitemos un documento, aparecerá aquí con instrucciones claras.",
    upload: "Cargar documento",
    received: "Recibido",
    processing: "En revisión de seguridad",
    correction: "Se necesita corrección",
    legalHold: "Conservación legal activa",
  },
  en: {
    title: "Documents",
    eyebrow: "Secure portal",
    intro: "Review requests and share documents through a protected channel.",
    allowedTitle: "Before you upload",
    allowedBody:
      "We accept PDF, JPG, and PNG files up to 25 MB. Do not send passwords, full account numbers, or sensitive information through other channels.",
    unavailableTitle: "Secure uploads are not available right now",
    unavailableBody:
      "Your documents have not been sent. Please try again later or contact SG Solutions.",
    emptyTitle: "You have no pending documents",
    emptyBody: "When we need a document, it will appear here with clear instructions.",
    upload: "Upload document",
    received: "Received",
    processing: "Security review in progress",
    correction: "Correction needed",
    legalHold: "Legal hold active",
  },
});
