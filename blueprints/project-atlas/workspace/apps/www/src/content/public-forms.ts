import { getPublishedProjection, publicFormRegistry } from "@atlas/domain";
import type { PublicPage } from "../domain/public-site";
import type {
  PublicFormRenderProjection,
  PublicFormFieldProjection,
} from "../components/forms/types";

type Locale = "es" | "en";
type Localized = Readonly<{ es: string; en: string }>;
const localized = (es: string, en: string): Localized => ({ es, en });

const formCopy: Record<string, { title: Localized; intro: Localized }> = {
  contact: { title: localized("Conversemos sobre lo que necesitas", "Let's talk about what you need"), intro: localized("Comparte la información básica para que podamos orientar el siguiente paso.", "Share the basic information we need to guide your next step.") },
  consultation: { title: localized("Solicita una asesoría", "Request a consultation"), intro: localized("Cuéntanos tu objetivo general y cuándo prefieres conversar.", "Tell us your general goal and when you prefer to talk.") },
  callback: { title: localized("Solicita una llamada", "Request a callback"), intro: localized("Indica cómo y cuándo podemos comunicarnos contigo.", "Tell us how and when we can reach you.") },
  credit_interest: { title: localized("Orientación inicial de crédito", "Initial credit guidance"), intro: localized("Comparte solo información aproximada para preparar una conversación.", "Share only approximate information so we can prepare for a conversation.") },
  taxes_interest: { title: localized("Orientación fiscal inicial", "Initial tax guidance"), intro: localized("Identifica tu situación general sin enviar declaraciones ni documentos.", "Describe your general situation without sending returns or documents.") },
  business_formation_interest: { title: localized("Interés en formación de negocio", "Business formation interest"), intro: localized("Comparte tu idea general. Este formulario no presenta una entidad automáticamente.", "Share your general idea. This form does not file an entity automatically.") },
  business_funding_interest: { title: localized("Interés en financiamiento empresarial", "Business funding interest"), intro: localized("Usa rangos aproximados. Ninguna respuesta garantiza aprobación.", "Use approximate ranges. No response guarantees approval.") },
  home_buying_interest: { title: localized("Asistencia inicial para comprar vivienda", "Initial home-buying assistance"), intro: localized("Comparte información preliminar; la elegibilidad se revisa por separado.", "Share preliminary information; eligibility is reviewed separately.") },
  marketplace_interest: { title: localized("Explora opciones del marketplace", "Explore marketplace options"), intro: localized("Indica tu interés. No compartiremos datos con partners sin tu autorización separada.", "Tell us what interests you. We will not share data with partners without your separate authorization.") },
};

const labels: Record<string, Localized> = {
  first_name: localized("Nombre", "First name"), last_name: localized("Apellido", "Last name"), email: localized("Email", "Email"), phone: localized("Teléfono", "Phone"), preferred_language: localized("Idioma preferido", "Preferred language"), state: localized("Estado", "State"), reason: localized("Motivo", "Reason"), message: localized("Mensaje breve", "Brief message"), contact_preference: localized("Preferencia de contacto", "Contact preference"), service: localized("Servicio solicitado", "Requested service"), objective: localized("Objetivo general", "General goal"), general_situation: localized("Situación general", "General situation"), availability: localized("Disponibilidad", "Availability"), preferred_channel: localized("Canal preferido", "Preferred channel"), preferred_time: localized("Horario preferido", "Preferred time"), timezone: localized("Zona horaria", "Time zone"), approximate_credit_band: localized("Rango crediticio aproximado (opcional)", "Approximate credit range (optional)"), future_home_purchase: localized("Estoy considerando comprar vivienda", "I am considering buying a home"), report_available: localized("Tengo un reporte disponible", "I have a report available"), general_problem_type: localized("Tipo general de situación", "General issue type"), appointment_preference: localized("Preferencia para una cita", "Appointment preference"), tax_year: localized("Año fiscal", "Tax year"), has_w2: localized("Tengo W-2", "I have W-2 forms"), has_1099: localized("Tengo 1099", "I have 1099 forms"), self_employed: localized("Trabajo por cuenta propia", "I am self-employed"), business_activity: localized("Actividad general", "General business activity"), has_dependents: localized("Tengo dependientes", "I have dependents"), documents_available: localized("Tengo documentos disponibles", "I have documents available"), desired_name: localized("Nombre deseado (opcional)", "Desired name (optional)"), activity: localized("Actividad del negocio", "Business activity"), structure_general: localized("Estructura general", "General structure"), owner_count: localized("Cantidad de propietarios", "Number of owners"), registered_agent_known: localized("Ya conozco al registered agent", "I already know the registered agent"), business_type: localized("Tipo de negocio", "Business type"), business_age_band: localized("Antigüedad del negocio", "Business age"), monthly_revenue_band: localized("Rango aproximado de ingresos mensuales", "Approximate monthly revenue range"), funding_amount_band: localized("Monto aproximado buscado", "Approximate funding amount"), use_of_funds: localized("Uso general de fondos", "General use of funds"), county: localized("Condado", "County"), household_size: localized("Tamaño del hogar", "Household size"), annual_income_band: localized("Rango aproximado de ingreso anual", "Approximate annual income range"), first_home: localized("Sería mi primera vivienda", "This would be my first home"), purchase_timeline: localized("Fecha estimada de compra", "Estimated purchase timing"), property_type: localized("Tipo de propiedad", "Property type"), program_interest: localized("Programa de interés (opcional)", "Program of interest (optional)"), product_category: localized("Categoría de producto", "Product category"),
};

const optionLabels: Record<string, Localized> = {
  spanish: localized("Español", "Spanish"), english: localized("Inglés", "English"), general_question: localized("Pregunta general", "General question"), service_question: localized("Pregunta sobre un servicio", "Service question"), callback_request: localized("Quiero una llamada", "I want a callback"), email: localized("Email", "Email"), phone: localized("Teléfono", "Phone"), sms: localized("SMS", "SMS"), whatsapp: localized("WhatsApp", "WhatsApp"), credit: localized("Crédito", "Credit"), taxes: localized("Taxes", "Taxes"), business_formation: localized("Formación de negocio", "Business formation"), business_funding: localized("Financiamiento empresarial", "Business funding"), home_buying: localized("Compra de vivienda", "Home buying"), marketplace: localized("Marketplace", "Marketplace"), weekday_morning: localized("Mañana entre semana", "Weekday morning"), weekday_afternoon: localized("Tarde entre semana", "Weekday afternoon"), weekday_evening: localized("Noche entre semana", "Weekday evening"), band_below_580: localized("Menos de 580", "Below 580"), band_580_619: localized("580–619", "580–619"), band_620_679: localized("620–679", "620–679"), band_680_plus: localized("680 o más", "680 or higher"), band_unknown: localized("No estoy seguro", "I'm not sure"), late_payments: localized("Pagos tardíos", "Late payments"), collections: localized("Collections", "Collections"), inaccuracies: localized("Información inexacta", "Inaccurate information"), other: localized("Otro", "Other"), single_member: localized("Un propietario", "Single owner"), multi_member: localized("Varios propietarios", "Multiple owners"), undecided: localized("Aún no decidido", "Not decided yet"), sole_proprietor: localized("Sole proprietor", "Sole proprietor"), llc: localized("LLC", "LLC"), corporation: localized("Corporation", "Corporation"), partnership: localized("Partnership", "Partnership"), pre_revenue: localized("Aún sin ingresos", "Pre-revenue"), under_one_year: localized("Menos de un año", "Under one year"), one_to_two_years: localized("Uno a dos años", "One to two years"), over_two_years: localized("Más de dos años", "Over two years"), revenue_under_5k: localized("Menos de $5k", "Under $5k"), revenue_5k_20k: localized("$5k–$20k", "$5k–$20k"), revenue_20k_50k: localized("$20k–$50k", "$20k–$50k"), revenue_over_50k: localized("Más de $50k", "Over $50k"), funding_under_25k: localized("Menos de $25k", "Under $25k"), funding_25k_100k: localized("$25k–$100k", "$25k–$100k"), funding_over_100k: localized("Más de $100k", "Over $100k"), income_under_40k: localized("Menos de $40k", "Under $40k"), income_40k_80k: localized("$40k–$80k", "$40k–$80k"), income_80k_150k: localized("$80k–$150k", "$80k–$150k"), income_over_150k: localized("Más de $150k", "Over $150k"), within_six_months: localized("Dentro de 6 meses", "Within 6 months"), six_to_twelve_months: localized("6–12 meses", "6–12 months"), over_twelve_months: localized("Más de 12 meses", "More than 12 months"), single_family: localized("Casa unifamiliar", "Single-family home"), condo: localized("Condominio", "Condo"), manufactured: localized("Vivienda manufacturada", "Manufactured home"), usda: localized("USDA", "USDA"), fha: localized("FHA", "FHA"), credit_monitoring: localized("Monitoreo de crédito", "Credit monitoring"), business_services: localized("Servicios de negocio", "Business services"), financial_products: localized("Productos financieros", "Financial products"),
};

const consentCopy: Record<string, { label: Localized; disclosure: Localized }> = {
  privacy_policy: { label: localized("Reconozco la Política de Privacidad.", "I acknowledge the Privacy Policy."), disclosure: localized("Versión de privacidad indicada para este formulario.", "Privacy version identified for this form.") },
  service_contact: { label: localized("SG Solutions puede contactarme sobre esta solicitud.", "SG Solutions may contact me about this request."), disclosure: localized("Solo para dar seguimiento a esta solicitud.", "Only to follow up on this request.") },
  sms_contact: { label: localized("Acepto contacto por SMS.", "I agree to SMS contact."), disclosure: localized("Opcional y separado de otros canales.", "Optional and separate from other channels.") },
  whatsapp_contact: { label: localized("Acepto contacto por WhatsApp.", "I agree to WhatsApp contact."), disclosure: localized("Opcional y separado de otros canales.", "Optional and separate from other channels.") },
  email_marketing: { label: localized("Acepto emails de marketing.", "I agree to marketing emails."), disclosure: localized("Opcional; no es necesario para enviar la solicitud.", "Optional; not required to submit the request.") },
  partner_data_sharing: { label: localized("Autorizo compartir los datos mínimos necesarios con un partner.", "I authorize sharing the minimum necessary data with a partner."), disclosure: localized("No se compartirán datos si esta opción permanece desmarcada.", "No data will be shared if this remains unchecked.") },
  financial_product_referral: { label: localized("Autorizo una referencia futura a productos financieros.", "I authorize a future financial-product referral."), disclosure: localized("Esto no constituye aprobación ni inicia una solicitud.", "This is not an approval and does not start an application.") },
};

function value(source: Record<string, Localized>, code: string, locale: Locale): string {
  const entry = source[code];
  if (!entry) throw new Error(`PUBLIC_FORM_COPY_MISSING:${code}:${locale}`);
  return entry[locale];
}

export function getPublicFormRenderProjection(formCode: string, locale: Locale): PublicFormRenderProjection | undefined {
  const definition = getPublishedProjection(formCode, locale);
  const metadata = formCopy[formCode];
  if (!definition || !metadata) return undefined;
  const fields: PublicFormFieldProjection[] = definition.fields.map((field) => ({
    fieldCode: field.fieldCode,
    fieldType: field.fieldType,
    label: value(labels, field.fieldCode, locale),
    required: field.required,
    ...(field.fieldType === "email" ? { autocomplete: "email", inputMode: "email" as const } : {}),
    ...(field.fieldType === "tel" ? { autocomplete: "tel", inputMode: "tel" as const } : {}),
    ...(field.fieldCode === "first_name" ? { autocomplete: "given-name" } : {}),
    ...(field.fieldCode === "last_name" ? { autocomplete: "family-name" } : {}),
    ...(field.maxLength === undefined ? {} : { maxLength: field.maxLength }),
    ...(field.minimum === undefined ? {} : { minimum: field.minimum }),
    ...(field.maximum === undefined ? {} : { maximum: field.maximum }),
    ...(field.visibleWhen ? { visibleWhen: field.visibleWhen } : {}),
    ...(field.optionCodes ? { options: field.optionCodes.map((code) => ({ code, label: value(optionLabels, code, locale) })) } : {}),
  }));
  const steps = [...new Set(definition.fields.map((field) => field.step))].map((step) => ({
    step,
    title: step === 1 ? (locale === "es" ? "Información básica" : "Basic information") : step === 2 ? (locale === "es" ? "Situación general" : "General situation") : (locale === "es" ? "Preferencias" : "Preferences"),
    description: locale === "es" ? "Completa solamente lo que corresponde a tu solicitud." : "Complete only what applies to your request.",
    fields: fields.filter((field) => definition.fields.find((candidate) => candidate.fieldCode === field.fieldCode)?.step === step),
  }));
  return {
    formCode: definition.formCode,
    version: definition.version,
    locale,
    purpose: definition.purpose,
    title: metadata.title[locale],
    eyebrow: locale === "es" ? "Solicitud segura" : "Secure request",
    introduction: metadata.intro[locale],
    privacyNote: locale === "es" ? "Recopilamos únicamente información preliminar necesaria para orientar el siguiente paso." : "We collect only the preliminary information needed to guide the next step.",
    portalNote: locale === "es" ? "No incluyas SSN, credenciales, números de cuenta, tarjetas, reportes ni documentos fiscales. La información sensible se solicita después en un portal seguro." : "Do not include SSNs, credentials, account or card numbers, reports, or tax documents. Sensitive information is requested later in a secure portal.",
    steps,
    consents: definition.consentRequirements.map((consent) => ({
      consentType: consent.consentType,
      version: consent.version,
      label: consentCopy[consent.consentType]!["label"][locale],
      disclosure: consentCopy[consent.consentType]!["disclosure"][locale],
      required: consent.required,
    })),
    copy: locale === "es" ? {
      progress: "Progreso", step: "Paso", of: "de", back: "Atrás", next: "Continuar", review: "Revisión", submit: "Enviar solicitud", edit: "Editar respuestas", reviewTitle: "Revisa antes de enviar", reviewIntro: "Confirma que la información general sea correcta.", consentTitle: "Tus preferencias y consentimientos", consentIntro: "Cada opción se registra por separado y las opcionales permanecen desmarcadas.", errorsTitle: "Revisa los siguientes campos", requiredError: "Este campo es obligatorio.", invalidError: "Revisa el valor ingresado.", sending: "Enviando de forma segura…", successTitle: "Recibimos tu solicitud", successBody: "Conserva el número de recibo. Esto no inicia un servicio ni confirma una cita o pago.", unavailable: "No pudimos recibir la solicitud ahora. Inténtalo más tarde o utiliza otra opción de contacto.",
    } : {
      progress: "Progress", step: "Step", of: "of", back: "Back", next: "Continue", review: "Review", submit: "Submit request", edit: "Edit answers", reviewTitle: "Review before submitting", reviewIntro: "Confirm that the general information is correct.", consentTitle: "Your preferences and consents", consentIntro: "Each choice is recorded separately and optional choices remain unchecked.", errorsTitle: "Review the following fields", requiredError: "This field is required.", invalidError: "Review the value entered.", sending: "Sending securely…", successTitle: "We received your request", successBody: "Keep the receipt number. This does not start a service or confirm an appointment or payment.", unavailable: "We could not receive the request right now. Try again later or use another contact option.",
    },
  };
}

export function getPublicFormStaticPaths(locale: Locale) {
  return publicFormRegistry.codes.map((formCode) => {
    const projection = getPublicFormRenderProjection(formCode, locale);
    if (!projection) throw new Error(`PUBLIC_FORM_PROJECTION_MISSING:${formCode}:${locale}`);
    const path = locale === "es" ? `/forms/${formCode}/` : `/en/forms/${formCode}/`;
    const alternatePath = locale === "es" ? `/en/forms/${formCode}/` : `/forms/${formCode}/`;
    const page: PublicPage = {
      routeKey: "contact",
      locale,
      path,
      kind: "standard",
      title: projection.title,
      description: projection.introduction,
      hero: { eyebrow: projection.eyebrow, heading: projection.title, summary: projection.introduction },
      sections: [],
      publicationState: "published",
    };
    return { params: { formCode }, props: { page, projection, alternatePath } };
  });
}
