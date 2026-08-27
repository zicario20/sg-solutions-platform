import type {
  ReceptionDisposition,
  ReceptionIntent,
  ReceptionIntentClassification,
  ReceptionLocale,
} from "./contracts.js";

const SENSITIVE_DATA_PATTERN =
  /\b(?:ssn|social security|ein|routing number|bank account|card number|password|credential)\b|\b\d{3}-\d{2}-\d{4}\b|\b\d{13,19}\b/iu;
const INSTRUCTION_INJECTION_PATTERN =
  /ignore\s+(?:all\s+)?previous\s+instructions|reveal\s+(?:the\s+)?system\s+prompt|bypass\s+(?:policy|approval|permission)|disable\s+(?:safety|guardrail)/iu;

type IntentRule = Readonly<{
  readonly intent: ReceptionIntent;
  readonly terms: readonly string[];
  readonly disposition: ReceptionDisposition;
  readonly requiresAuthentication: boolean;
  readonly requiresHumanReview: boolean;
}>;

const INTENT_RULES: readonly IntentRule[] = [
  {
    intent: "complaint_or_safety",
    terms: ["complaint", "queja", "fraud", "fraude", "unsafe", "seguridad"],
    disposition: "human_transfer_required",
    requiresAuthentication: false,
    requiresHumanReview: true,
  },
  {
    intent: "human_support",
    terms: ["human", "persona", "representative", "representante", "agent", "agente"],
    disposition: "human_transfer_required",
    requiresAuthentication: false,
    requiresHumanReview: true,
  },
  {
    intent: "appointment_request",
    terms: ["appointment", "schedule", "book", "cita", "agendar", "agenda"],
    disposition: "appointment_handoff_requested",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "lead_or_evaluation_request",
    terms: ["evaluation", "quote", "cotizacion", "evaluacion", "contact me", "contactenme"],
    disposition: "lead_capture_requested",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "payment_or_quote_access",
    terms: ["payment", "pay", "invoice", "pago", "factura", "quote link", "enlace de cotizacion"],
    disposition: "authenticated_support_required",
    requiresAuthentication: true,
    requiresHumanReview: false,
  },
  {
    intent: "secure_document_access",
    terms: ["document", "upload", "archivo", "subir documento"],
    disposition: "authenticated_support_required",
    requiresAuthentication: true,
    requiresHumanReview: false,
  },
  {
    intent: "authenticated_support",
    terms: ["my case", "my account", "mi caso", "mi cuenta", "existing client", "cliente actual"],
    disposition: "authenticated_support_required",
    requiresAuthentication: true,
    requiresHumanReview: false,
  },
  {
    intent: "business_formation_information",
    terms: ["llc", "ein", "business formation", "formacion de negocio", "formar negocio"],
    disposition: "intake_handoff_requested",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "business_funding_information",
    terms: ["business funding", "capital", "funding", "financiamiento comercial"],
    disposition: "intake_handoff_requested",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "home_buying_information",
    terms: ["home buying", "mortgage", "fha", "comprar casa", "hipoteca", "vivienda"],
    disposition: "intake_handoff_requested",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "tax_service_information",
    terms: ["tax", "taxes", "w-2", "1099", "impuesto", "impuestos"],
    disposition: "intake_handoff_requested",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "credit_service_information",
    terms: ["credit", "repair", "score", "credito", "reparacion"],
    disposition: "public_knowledge_only",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "marketplace_information",
    terms: ["marketplace", "partner", "proveedor externo", "referral"],
    disposition: "public_knowledge_only",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
  {
    intent: "general_service_information",
    terms: ["service", "services", "servicio", "servicios", "what do you offer", "que ofrecen"],
    disposition: "public_knowledge_only",
    requiresAuthentication: false,
    requiresHumanReview: false,
  },
];

function containsTerm(message: string, terms: readonly string[]): boolean {
  return terms.some((term) => message.includes(term));
}

export function classifyReceptionIntent(input: {
  readonly locale: ReceptionLocale;
  readonly message: string;
}): ReceptionIntentClassification {
  const normalized = input.message
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .normalize("NFC")
    .toLocaleLowerCase(input.locale);
  if (normalized.trim().length === 0 || normalized.length > 2_000)
    throw new TypeError("reception message must be between 1 and 2000 characters");

  if (SENSITIVE_DATA_PATTERN.test(normalized)) {
    return Object.freeze({
      intent: "complaint_or_safety" as const,
      risk: "high" as const,
      disposition: "secure_channel_required" as const,
      reasonCodes: Object.freeze(["sensitive_data_detected"]),
      requiresAuthentication: true,
      requiresHumanReview: true,
    });
  }

  if (INSTRUCTION_INJECTION_PATTERN.test(normalized)) {
    return Object.freeze({
      intent: "complaint_or_safety" as const,
      risk: "high" as const,
      disposition: "human_transfer_required" as const,
      reasonCodes: Object.freeze(["untrusted_instruction_detected"]),
      requiresAuthentication: false,
      requiresHumanReview: true,
    });
  }

  const rule = INTENT_RULES.find((candidate) => containsTerm(normalized, candidate.terms));
  if (!rule) {
    return Object.freeze({
      intent: "unknown" as const,
      risk: "moderate" as const,
      disposition: "human_transfer_required" as const,
      reasonCodes: Object.freeze(["clarification_required"]),
      requiresAuthentication: false,
      requiresHumanReview: true,
    });
  }

  return Object.freeze({
    intent: rule.intent,
    risk: rule.requiresHumanReview ? ("moderate" as const) : ("low" as const),
    disposition: rule.disposition,
    reasonCodes: Object.freeze(["deterministic_intent_match"]),
    requiresAuthentication: rule.requiresAuthentication,
    requiresHumanReview: rule.requiresHumanReview,
  });
}
