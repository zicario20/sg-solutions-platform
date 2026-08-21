export type PublicFormLocale = "es" | "en";

export type PublicFieldSensitivity =
  | "public"
  | "basic_personal"
  | "confidential"
  | "financial"
  | "tax"
  | "credit"
  | "identity"
  | "restricted";

export type PublicFieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "select"
  | "radio"
  | "checkbox"
  | "boolean"
  | "number"
  | "currency"
  | "date"
  | "state"
  | "timezone";

export type PublicAnswerValue = string | number | boolean;

export type ConditionNode =
  | { operator: "equals"; fieldCode: string; value: PublicAnswerValue }
  | { operator: "present"; fieldCode: string }
  | { operator: "not"; condition: ConditionNode }
  | { operator: "all" | "any"; conditions: readonly ConditionNode[] };

export type FormFieldDefinition = Readonly<{
  fieldCode: string;
  fieldType: PublicFieldType;
  step: number;
  required: boolean;
  sensitivity: PublicFieldSensitivity;
  labelId: string;
  helpTextId?: string;
  optionCodes?: readonly string[];
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  visibleWhen?: ConditionNode;
}>;

export type FormConsentRequirement = Readonly<{
  consentType: string;
  version: string;
  disclosureReference: string;
  required: boolean;
}>;

export type FormDefinitionVersion = Readonly<{
  formCode: string;
  version: string;
  locale: PublicFormLocale;
  audience: "public" | "staff_preview";
  purpose: "lead_request" | "callback_request" | "appointment_preference" | "service_interest";
  status: "draft" | "published" | "disabled" | "archived";
  serviceCode?: string;
  retentionClass: "public_lead_request" | "ephemeral_callback" | "service_interest";
  schemaHash: string;
  uiHash: string;
  disclosureReferences: readonly string[];
  consentRequirements: readonly FormConsentRequirement[];
  approvedActions: readonly (
    | "lead_candidate"
    | "appointment_intent"
    | "payment_handoff"
    | "channel_handoff"
    | "notification_intent"
  )[];
  fields: readonly FormFieldDefinition[];
}>;

export type PublishedFormDefinition = Readonly<{
  es: FormDefinitionVersion;
  en: FormDefinitionVersion;
}>;

export type FormVisibility = Readonly<{
  visible: readonly string[];
  hidden: readonly string[];
}>;
