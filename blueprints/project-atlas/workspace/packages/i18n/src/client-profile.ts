export const clientProfileCopy = {
  es: {
    eyebrow: "Perfil",
    title: "Tu información, con propósito",
    intro:
      "Indica una necesidad general para que SG Solutions prepare tu próximo paso. No envíes información sensible.",
    noticeTitle: "Información limitada por diseño",
    notice:
      "Esta primera etapa solo registra objetivos generales. Las actualizaciones quedan sujetas a revisión y no inician un servicio.",
    goalTitle: "¿Qué quieres organizar?",
    goalLabel: "Objetivo general",
    goalOptions: {
      credit_organization: "Organizar mi crédito",
      tax_preparation: "Preparar taxes",
      business_planning: "Planificar un negocio",
      home_buying_preparation: "Prepararme para comprar casa",
      general_support: "Recibir orientación general",
    },
    noticeLabel:
      "Entiendo que no debo enviar información sensible y que este objetivo será revisado.",
    submit: "Enviar objetivo",
    submitting: "Enviando",
    goalsTitle: "Objetivos enviados",
    noGoals: "Todavía no has enviado un objetivo.",
    state: {
      submitted: "Enviado para revisión",
      under_review: "En revisión",
      accepted: "Aceptado",
      rejected: "No aceptado",
    },
    unavailable: "El perfil no está habilitado en este entorno todavía.",
    retry: "Reintentar",
    financialTitle: "Preparación financiera para comprar casa",
    financialIntro:
      "Comparte solo ingresos mensuales brutos y deudas mensuales recurrentes para una orientación preliminar. Esto no es una aprobación ni una recomendación de préstamo.",
    incomeLabel: "Ingreso mensual bruto (USD)",
    debtLabel: "Deuda mensual recurrente (USD)",
    financialAcknowledgement:
      "Entiendo que este cálculo es preliminar, no determina elegibilidad y quedará sujeto a revisión.",
    financialSubmit: "Enviar información preliminar",
    financialSubmitting: "Enviando información",
    financialUnavailable:
      "La preparación financiera segura no está habilitada en este entorno todavía.",
    dtiLabel: "Relación deuda-ingreso preliminar",
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
      "Share a general need so SG Solutions can prepare your next step. Do not send sensitive information.",
    noticeTitle: "Information is limited by design",
    notice:
      "This first stage only records general goals. Updates remain subject to review and do not start a service.",
    goalTitle: "What would you like to organize?",
    goalLabel: "General goal",
    goalOptions: {
      credit_organization: "Organize my credit",
      tax_preparation: "Prepare taxes",
      business_planning: "Plan a business",
      home_buying_preparation: "Prepare to buy a home",
      general_support: "Receive general guidance",
    },
    noticeLabel:
      "I understand that I should not send sensitive information and that this goal will be reviewed.",
    submit: "Submit goal",
    submitting: "Submitting",
    goalsTitle: "Submitted goals",
    noGoals: "You have not submitted a goal yet.",
    state: {
      submitted: "Submitted for review",
      under_review: "Under review",
      accepted: "Accepted",
      rejected: "Not accepted",
    },
    unavailable: "The profile is not enabled in this environment yet.",
    retry: "Retry",
    financialTitle: "Financial preparation for home buying",
    financialIntro:
      "Share only monthly gross income and recurring monthly debt for preliminary guidance. This is not an approval or lending recommendation.",
    incomeLabel: "Monthly gross income (USD)",
    debtLabel: "Recurring monthly debt (USD)",
    financialAcknowledgement:
      "I understand this calculation is preliminary, does not determine eligibility, and remains subject to review.",
    financialSubmit: "Submit preliminary information",
    financialSubmitting: "Submitting information",
    financialUnavailable: "Secure financial preparation is not enabled in this environment yet.",
    dtiLabel: "Preliminary debt-to-income ratio",
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
