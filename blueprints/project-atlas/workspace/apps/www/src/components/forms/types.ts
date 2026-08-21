import type { ConditionNode, PublicFieldType } from "@atlas/domain";

export type PublicFormOptionProjection = Readonly<{
  code: string;
  label: string;
}>;

export type PublicFormFieldProjection = Readonly<{
  fieldCode: string;
  fieldType: PublicFieldType;
  label: string;
  helpText?: string;
  required: boolean;
  autocomplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  options?: readonly PublicFormOptionProjection[];
  visibleWhen?: ConditionNode;
}>;

export type PublicFormStepProjection = Readonly<{
  step: number;
  title: string;
  description?: string;
  fields: readonly PublicFormFieldProjection[];
}>;

export type PublicFormConsentProjection = Readonly<{
  consentType: string;
  version: string;
  label: string;
  disclosure: string;
  required: boolean;
}>;

export type PublicFormRenderProjection = Readonly<{
  formCode: string;
  version: string;
  locale: "es" | "en";
  purpose: "lead_request" | "callback_request" | "appointment_preference" | "service_interest";
  title: string;
  eyebrow: string;
  introduction: string;
  privacyNote: string;
  portalNote: string;
  steps: readonly PublicFormStepProjection[];
  consents: readonly PublicFormConsentProjection[];
  copy: Readonly<{
    progress: string;
    step: string;
    of: string;
    back: string;
    next: string;
    review: string;
    submit: string;
    edit: string;
    reviewTitle: string;
    reviewIntro: string;
    consentTitle: string;
    consentIntro: string;
    errorsTitle: string;
    requiredError: string;
    invalidError: string;
    sending: string;
    successTitle: string;
    successBody: string;
    unavailable: string;
  }>;
}>;
