import type {
  ConditionNode,
  FormConsentRequirement,
  FormDefinitionVersion,
  FormFieldDefinition,
  PublicFieldSensitivity,
  PublicFieldType,
  PublicFormLocale,
  PublishedFormDefinition,
} from "./contracts.ts";
import { validatePublishedDefinition } from "./definition.ts";

export const PUBLIC_FORM_CODES = [
  "contact",
  "consultation",
  "callback",
  "credit_interest",
  "taxes_interest",
  "business_formation_interest",
  "business_funding_interest",
  "home_buying_interest",
  "marketplace_interest",
] as const;

export type PublicFormCode = (typeof PUBLIC_FORM_CODES)[number];

type FieldSeed = Readonly<{
  fieldCode: string;
  fieldType: PublicFieldType;
  step: number;
  required?: boolean;
  sensitivity?: PublicFieldSensitivity;
  optionCodes?: readonly string[];
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  visibleWhen?: ConditionNode;
}>;

type FormSeed = Readonly<{
  formCode: PublicFormCode;
  purpose: FormDefinitionVersion["purpose"];
  serviceCode?: string;
  retentionClass: FormDefinitionVersion["retentionClass"];
  approvedActions: FormDefinitionVersion["approvedActions"];
  consentRequirements: readonly FormConsentRequirement[];
  fields: readonly FieldSeed[];
}>;

const privacyConsent: FormConsentRequirement = {
  consentType: "privacy_policy",
  version: "1.0.0",
  disclosureReference: "privacy_policy_v1",
  required: true,
};
const serviceConsent: FormConsentRequirement = {
  consentType: "service_contact",
  version: "1.0.0",
  disclosureReference: "service_contact_v1",
  required: true,
};
const smsConsent: FormConsentRequirement = {
  consentType: "sms_contact",
  version: "1.0.0",
  disclosureReference: "sms_contact_v1",
  required: false,
};
const whatsappConsent: FormConsentRequirement = {
  consentType: "whatsapp_contact",
  version: "1.0.0",
  disclosureReference: "whatsapp_contact_v1",
  required: false,
};
const emailMarketingConsent: FormConsentRequirement = {
  consentType: "email_marketing",
  version: "1.0.0",
  disclosureReference: "email_marketing_v1",
  required: false,
};
const partnerConsent: FormConsentRequirement = {
  consentType: "partner_data_sharing",
  version: "1.0.0",
  disclosureReference: "partner_data_sharing_v1",
  required: false,
};
const referralConsent: FormConsentRequirement = {
  consentType: "financial_product_referral",
  version: "1.0.0",
  disclosureReference: "financial_product_referral_v1",
  required: false,
};

const basicIdentity: readonly FieldSeed[] = [
  {
    fieldCode: "first_name",
    fieldType: "text",
    step: 1,
    required: true,
    sensitivity: "basic_personal",
    maxLength: 80,
  },
  {
    fieldCode: "last_name",
    fieldType: "text",
    step: 1,
    required: true,
    sensitivity: "basic_personal",
    maxLength: 80,
  },
  {
    fieldCode: "email",
    fieldType: "email",
    step: 1,
    required: true,
    sensitivity: "basic_personal",
  },
  { fieldCode: "phone", fieldType: "tel", step: 1, required: true, sensitivity: "basic_personal" },
  {
    fieldCode: "preferred_language",
    fieldType: "select",
    step: 1,
    required: true,
    optionCodes: ["spanish", "english"],
  },
  { fieldCode: "state", fieldType: "state", step: 1, required: true },
];

const appointmentPreference: FieldSeed = {
  fieldCode: "appointment_preference",
  fieldType: "select",
  step: 3,
  required: false,
  optionCodes: ["weekday_morning", "weekday_afternoon", "weekday_evening"],
};

const seeds: readonly FormSeed[] = [
  {
    formCode: "contact",
    purpose: "lead_request",
    retentionClass: "public_lead_request",
    approvedActions: ["lead_candidate", "channel_handoff"],
    consentRequirements: [
      privacyConsent,
      serviceConsent,
      smsConsent,
      whatsappConsent,
      emailMarketingConsent,
    ],
    fields: [
      ...basicIdentity,
      {
        fieldCode: "reason",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["general_question", "service_question", "callback_request"],
      },
      { fieldCode: "message", fieldType: "textarea", step: 2, required: true, maxLength: 1_000 },
      {
        fieldCode: "contact_preference",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["email", "phone", "sms", "whatsapp"],
      },
    ],
  },
  {
    formCode: "consultation",
    purpose: "appointment_preference",
    retentionClass: "public_lead_request",
    approvedActions: ["lead_candidate", "appointment_intent", "channel_handoff"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent, whatsappConsent],
    fields: [
      ...basicIdentity,
      {
        fieldCode: "service",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: [
          "credit",
          "taxes",
          "business_formation",
          "business_funding",
          "home_buying",
          "marketplace",
        ],
      },
      { fieldCode: "objective", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
      {
        fieldCode: "general_situation",
        fieldType: "textarea",
        step: 2,
        required: false,
        maxLength: 800,
      },
      {
        fieldCode: "availability",
        fieldType: "select",
        step: 3,
        required: true,
        optionCodes: ["weekday_morning", "weekday_afternoon", "weekday_evening"],
      },
      {
        fieldCode: "preferred_channel",
        fieldType: "select",
        step: 3,
        required: true,
        optionCodes: ["email", "phone", "sms", "whatsapp"],
      },
    ],
  },
  {
    formCode: "callback",
    purpose: "callback_request",
    retentionClass: "ephemeral_callback",
    approvedActions: ["lead_candidate", "channel_handoff", "notification_intent"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent],
    fields: [
      {
        fieldCode: "first_name",
        fieldType: "text",
        step: 1,
        required: true,
        sensitivity: "basic_personal",
        maxLength: 80,
      },
      {
        fieldCode: "last_name",
        fieldType: "text",
        step: 1,
        required: true,
        sensitivity: "basic_personal",
        maxLength: 80,
      },
      {
        fieldCode: "phone",
        fieldType: "tel",
        step: 1,
        required: true,
        sensitivity: "basic_personal",
      },
      {
        fieldCode: "preferred_language",
        fieldType: "select",
        step: 1,
        required: true,
        optionCodes: ["spanish", "english"],
      },
      {
        fieldCode: "service",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: [
          "credit",
          "taxes",
          "business_formation",
          "business_funding",
          "home_buying",
          "marketplace",
        ],
      },
      {
        fieldCode: "preferred_time",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["weekday_morning", "weekday_afternoon", "weekday_evening"],
      },
      { fieldCode: "timezone", fieldType: "timezone", step: 2, required: true },
      { fieldCode: "reason", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
    ],
  },
  {
    formCode: "credit_interest",
    purpose: "service_interest",
    serviceCode: "credit",
    retentionClass: "service_interest",
    approvedActions: ["lead_candidate", "appointment_intent"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent, whatsappConsent],
    fields: [
      ...basicIdentity,
      { fieldCode: "objective", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
      {
        fieldCode: "approximate_credit_band",
        fieldType: "select",
        step: 2,
        sensitivity: "financial",
        optionCodes: [
          "band_below_580",
          "band_580_619",
          "band_620_679",
          "band_680_plus",
          "band_unknown",
        ],
      },
      { fieldCode: "future_home_purchase", fieldType: "boolean", step: 2 },
      { fieldCode: "report_available", fieldType: "boolean", step: 2 },
      {
        fieldCode: "general_problem_type",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["late_payments", "collections", "inaccuracies", "other"],
      },
      appointmentPreference,
    ],
  },
  {
    formCode: "taxes_interest",
    purpose: "service_interest",
    serviceCode: "taxes",
    retentionClass: "service_interest",
    approvedActions: ["lead_candidate", "appointment_intent"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent],
    fields: [
      ...basicIdentity,
      {
        fieldCode: "tax_year",
        fieldType: "number",
        step: 2,
        required: true,
        minimum: 2000,
        maximum: 2100,
      },
      { fieldCode: "has_w2", fieldType: "boolean", step: 2 },
      { fieldCode: "has_1099", fieldType: "boolean", step: 2 },
      { fieldCode: "self_employed", fieldType: "boolean", step: 2 },
      {
        fieldCode: "business_activity",
        fieldType: "text",
        step: 2,
        maxLength: 160,
        visibleWhen: { operator: "equals", fieldCode: "self_employed", value: true },
      },
      { fieldCode: "has_dependents", fieldType: "boolean", step: 2 },
      { fieldCode: "documents_available", fieldType: "boolean", step: 2 },
      { fieldCode: "objective", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
      appointmentPreference,
    ],
  },
  {
    formCode: "business_formation_interest",
    purpose: "service_interest",
    serviceCode: "business_formation",
    retentionClass: "service_interest",
    approvedActions: ["lead_candidate", "appointment_intent"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent],
    fields: [
      ...basicIdentity,
      { fieldCode: "desired_name", fieldType: "text", step: 2, maxLength: 160 },
      { fieldCode: "activity", fieldType: "textarea", step: 2, required: true, maxLength: 500 },
      {
        fieldCode: "structure_general",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["single_member", "multi_member", "undecided"],
      },
      {
        fieldCode: "owner_count",
        fieldType: "number",
        step: 2,
        required: true,
        minimum: 2,
        maximum: 20,
        visibleWhen: { operator: "equals", fieldCode: "structure_general", value: "multi_member" },
      },
      { fieldCode: "registered_agent_known", fieldType: "boolean", step: 2 },
      { fieldCode: "objective", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
      appointmentPreference,
    ],
  },
  {
    formCode: "business_funding_interest",
    purpose: "service_interest",
    serviceCode: "business_funding",
    retentionClass: "service_interest",
    approvedActions: ["lead_candidate", "appointment_intent"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent],
    fields: [
      ...basicIdentity,
      {
        fieldCode: "business_type",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["sole_proprietor", "llc", "corporation", "partnership", "other"],
      },
      {
        fieldCode: "business_age_band",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["pre_revenue", "under_one_year", "one_to_two_years", "over_two_years"],
      },
      {
        fieldCode: "monthly_revenue_band",
        fieldType: "select",
        step: 2,
        sensitivity: "financial",
        optionCodes: ["revenue_under_5k", "revenue_5k_20k", "revenue_20k_50k", "revenue_over_50k"],
      },
      {
        fieldCode: "funding_amount_band",
        fieldType: "select",
        step: 2,
        sensitivity: "financial",
        optionCodes: ["funding_under_25k", "funding_25k_100k", "funding_over_100k"],
      },
      { fieldCode: "use_of_funds", fieldType: "textarea", step: 2, required: true, maxLength: 500 },
      { fieldCode: "objective", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
      appointmentPreference,
    ],
  },
  {
    formCode: "home_buying_interest",
    purpose: "service_interest",
    serviceCode: "home_buying",
    retentionClass: "service_interest",
    approvedActions: ["lead_candidate", "appointment_intent"],
    consentRequirements: [privacyConsent, serviceConsent, smsConsent],
    fields: [
      ...basicIdentity,
      { fieldCode: "county", fieldType: "text", step: 2, required: true, maxLength: 100 },
      {
        fieldCode: "household_size",
        fieldType: "number",
        step: 2,
        required: true,
        minimum: 1,
        maximum: 30,
      },
      {
        fieldCode: "annual_income_band",
        fieldType: "select",
        step: 2,
        sensitivity: "financial",
        optionCodes: ["income_under_40k", "income_40k_80k", "income_80k_150k", "income_over_150k"],
      },
      {
        fieldCode: "approximate_credit_band",
        fieldType: "select",
        step: 2,
        sensitivity: "financial",
        optionCodes: [
          "band_below_580",
          "band_580_619",
          "band_620_679",
          "band_680_plus",
          "band_unknown",
        ],
      },
      { fieldCode: "first_home", fieldType: "boolean", step: 2 },
      {
        fieldCode: "purchase_timeline",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["within_six_months", "six_to_twelve_months", "over_twelve_months"],
      },
      {
        fieldCode: "property_type",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["single_family", "condo", "manufactured", "undecided"],
      },
      {
        fieldCode: "program_interest",
        fieldType: "select",
        step: 2,
        optionCodes: ["usda", "fha", "other", "undecided"],
      },
      appointmentPreference,
    ],
  },
  {
    formCode: "marketplace_interest",
    purpose: "service_interest",
    serviceCode: "marketplace",
    retentionClass: "service_interest",
    approvedActions: ["lead_candidate"],
    consentRequirements: [
      privacyConsent,
      serviceConsent,
      partnerConsent,
      referralConsent,
      emailMarketingConsent,
    ],
    fields: [
      ...basicIdentity,
      {
        fieldCode: "product_category",
        fieldType: "select",
        step: 2,
        required: true,
        optionCodes: ["credit_monitoring", "business_services", "financial_products", "other"],
      },
      {
        fieldCode: "approximate_credit_band",
        fieldType: "select",
        step: 2,
        sensitivity: "financial",
        optionCodes: [
          "band_below_580",
          "band_580_619",
          "band_620_679",
          "band_680_plus",
          "band_unknown",
        ],
      },
      { fieldCode: "objective", fieldType: "textarea", step: 2, required: true, maxLength: 600 },
    ],
  },
];

function hash(value: unknown): string {
  const serialized = JSON.stringify(value);
  const accumulators = [
    0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1, 0xd3a2646c, 0xfd7046c5,
  ];

  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    for (let lane = 0; lane < accumulators.length; lane += 1) {
      const mixedCode = code + Math.imul(index + 1, lane + 17);
      accumulators[lane] = Math.imul((accumulators[lane] ?? 0) ^ mixedCode, 0x01000193 + lane * 2);
    }
  }

  return accumulators
    .map((accumulator) => (accumulator >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function buildVersion(seed: FormSeed, locale: PublicFormLocale): FormDefinitionVersion {
  const structure = {
    formCode: seed.formCode,
    version: "1.0.0",
    purpose: seed.purpose,
    serviceCode: seed.serviceCode,
    retentionClass: seed.retentionClass,
    approvedActions: seed.approvedActions,
    consentRequirements: seed.consentRequirements,
    fields: seed.fields,
  };
  const fields: readonly FormFieldDefinition[] = seed.fields.map((field) => ({
    fieldCode: field.fieldCode,
    fieldType: field.fieldType,
    step: field.step,
    required: field.required ?? false,
    sensitivity: field.sensitivity ?? "public",
    labelId: `forms.${seed.formCode}.${locale}.${field.fieldCode}`,
    ...(field.optionCodes ? { optionCodes: field.optionCodes } : {}),
    ...(field.minimum === undefined ? {} : { minimum: field.minimum }),
    ...(field.maximum === undefined ? {} : { maximum: field.maximum }),
    ...(field.maxLength === undefined ? {} : { maxLength: field.maxLength }),
    ...(field.visibleWhen ? { visibleWhen: field.visibleWhen } : {}),
  }));
  return Object.freeze({
    formCode: seed.formCode,
    version: "1.0.0",
    locale,
    audience: "public",
    purpose: seed.purpose,
    status: "published",
    ...(seed.serviceCode ? { serviceCode: seed.serviceCode } : {}),
    retentionClass: seed.retentionClass,
    schemaHash: hash(structure),
    uiHash: hash({ locale, fields: fields.map((field) => field.labelId) }),
    disclosureReferences: ["privacy_policy_v1"],
    approvedActions: Object.freeze([...seed.approvedActions]),
    consentRequirements: Object.freeze(
      seed.consentRequirements.map((consent) => Object.freeze({ ...consent })),
    ),
    fields: Object.freeze(fields),
  });
}

const registry = new Map<PublicFormCode, PublishedFormDefinition>();
for (const seed of seeds) {
  const pair = validatePublishedDefinition({
    es: buildVersion(seed, "es"),
    en: buildVersion(seed, "en"),
  });
  registry.set(seed.formCode, pair);
}

export const publicFormRegistry = Object.freeze({
  codes: Object.freeze([...PUBLIC_FORM_CODES]),
  get(formCode: string): PublishedFormDefinition | undefined {
    return registry.get(formCode as PublicFormCode);
  },
});

export function getPublishedProjection(
  formCode: string,
  locale: PublicFormLocale,
): FormDefinitionVersion | undefined {
  return publicFormRegistry.get(formCode)?.[locale];
}

export function renderSyntheticPreview(
  definition: FormDefinitionVersion,
  authorization: { permission: string; subjectId?: string },
) {
  if (
    authorization.permission !== "forms.definition_preview" ||
    !authorization.subjectId ||
    !/^staff_[A-Za-z0-9._:-]{3,120}$/u.test(authorization.subjectId)
  ) {
    throw new Error("FORM_PREVIEW_FORBIDDEN");
  }
  return Object.freeze({
    banner: "synthetic preview" as const,
    readOnly: true as const,
    formCode: definition.formCode,
    version: definition.version,
    locale: definition.locale,
    values: Object.freeze(
      definition.fields.map((field) =>
        Object.freeze({ fieldCode: field.fieldCode, value: `synthetic:${field.fieldCode}` }),
      ),
    ),
  });
}
