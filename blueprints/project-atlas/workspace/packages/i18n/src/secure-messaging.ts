import type { DashboardLocale } from "@atlas/dashboard";
export const secureMessagingCopy: Record<
  DashboardLocale,
  { title: string; intro: string; unavailable: string; empty: string }
> = {
  es: {
    title: "Mensajes",
    intro: "Comunícate de forma segura sobre tus servicios y solicitudes.",
    unavailable: "La mensajería segura no está disponible ahora. Tus datos permanecen protegidos.",
    empty: "No tienes conversaciones activas.",
  },
  en: {
    title: "Messages",
    intro: "Communicate securely about your services and requests.",
    unavailable: "Secure messaging is not available right now. Your data remains protected.",
    empty: "You have no active conversations.",
  },
};
