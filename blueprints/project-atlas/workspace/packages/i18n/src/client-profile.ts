export const clientProfileCopy = {
  es: {
    eyebrow: "Perfil",
    title: "Tu información, con propósito",
    intro:
      "Tu perfil se habilitará cuando las políticas de privacidad, consentimiento y revisión estén configuradas para tu servicio.",
    noticeTitle: "Perfil todavía no disponible",
    notice:
      "Para proteger tu información, esta función no acepta ni muestra datos personales, financieros o empresariales mientras su fuente autorizada no esté activa.",
    sections: [
      "Información básica y preferencias aprobadas",
      "Datos solicitados solo para un servicio autorizado",
      "Cambios que se revisan antes de actualizar información verificada",
    ],
    avoidTitle: "No envíes datos sensibles aquí",
    avoid:
      "No compartas números de Seguro Social, EIN, credenciales, reportes completos, declaraciones, cuentas bancarias o documentos por esta pantalla.",
    support: "Contactar soporte",
    back: "Volver a configuración",
  },
  en: {
    eyebrow: "Profile",
    title: "Your information, with a purpose",
    intro:
      "Your profile will be enabled when privacy, consent, and review policies are configured for your service.",
    noticeTitle: "Profile not available yet",
    notice:
      "To protect your information, this feature does not accept or show personal, financial, or business data while its authorized source is not active.",
    sections: [
      "Approved basic information and preferences",
      "Information requested only for an authorized service",
      "Changes reviewed before verified information is updated",
    ],
    avoidTitle: "Do not send sensitive information here",
    avoid:
      "Do not share Social Security numbers, EINs, credentials, full reports, returns, bank accounts, or documents through this screen.",
    support: "Contact support",
    back: "Back to settings",
  },
} as const;
export type ClientProfileLocale = keyof typeof clientProfileCopy;
