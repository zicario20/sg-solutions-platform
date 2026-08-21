import type {
  ConditionNode,
  FormDefinitionVersion,
  FormFieldDefinition,
  FormVisibility,
  PublicAnswerValue,
  PublishedFormDefinition,
} from "./contracts.ts";

const IDENTIFIER = /^[a-z][a-z0-9_]{1,63}$/u;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const CONTENT_ID = /^[a-z][a-z0-9_.:-]{2,127}$/u;
const SAFE_SENSITIVITIES = new Set(["public", "basic_personal"]);
const COARSE_FINANCIAL_FIELDS = new Set([
  "annual_income_band",
  "approximate_credit_band",
  "monthly_revenue_band",
  "funding_amount_band",
]);
const ACTIONS = new Set([
  "lead_candidate",
  "appointment_intent",
  "payment_handoff",
  "channel_handoff",
  "notification_intent",
]);

function fail(code: string): never {
  throw new Error(code);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateCondition(
  value: unknown,
  fieldCodes: ReadonlySet<string>,
  depth = 0,
  budget = { remaining: 32 },
): asserts value is ConditionNode {
  if (!isPlainRecord(value) || depth > 4 || --budget.remaining < 0) fail("CONDITION_RULE_INVALID");
  const keys = Object.keys(value);
  if (value.operator === "equals") {
    if (
      keys.some((key) => !["operator", "fieldCode", "value"].includes(key)) ||
      typeof value.fieldCode !== "string" ||
      !fieldCodes.has(value.fieldCode) ||
      !["string", "number", "boolean"].includes(typeof value.value)
    ) {
      fail("CONDITION_RULE_INVALID");
    }
    return;
  }
  if (value.operator === "present") {
    if (
      keys.some((key) => !["operator", "fieldCode"].includes(key)) ||
      typeof value.fieldCode !== "string" ||
      !fieldCodes.has(value.fieldCode)
    ) {
      fail("CONDITION_RULE_INVALID");
    }
    return;
  }
  if (value.operator === "not") {
    if (keys.some((key) => !["operator", "condition"].includes(key))) {
      fail("CONDITION_RULE_INVALID");
    }
    validateCondition(value.condition, fieldCodes, depth + 1, budget);
    return;
  }
  if (value.operator === "all" || value.operator === "any") {
    if (
      keys.some((key) => !["operator", "conditions"].includes(key)) ||
      !Array.isArray(value.conditions) ||
      value.conditions.length < 1 ||
      value.conditions.length > 12
    ) {
      fail("CONDITION_RULE_INVALID");
    }
    for (const condition of value.conditions) {
      validateCondition(condition, fieldCodes, depth + 1, budget);
    }
    return;
  }
  fail("CONDITION_RULE_INVALID");
}

function validateVersion(definition: FormDefinitionVersion, expectedLocale: "es" | "en"): void {
  if (
    !isPlainRecord(definition) ||
    definition.locale !== expectedLocale ||
    definition.status !== "published" ||
    definition.audience !== "public" ||
    !IDENTIFIER.test(definition.formCode) ||
    !SEMVER.test(definition.version) ||
    !SHA256.test(definition.schemaHash) ||
    !SHA256.test(definition.uiHash) ||
    !Array.isArray(definition.fields) ||
    definition.fields.length < 1 ||
    definition.fields.length > 48 ||
    !Array.isArray(definition.disclosureReferences) ||
    definition.disclosureReferences.length < 1 ||
    definition.disclosureReferences.some((reference) => !CONTENT_ID.test(reference)) ||
    !Array.isArray(definition.approvedActions) ||
    definition.approvedActions.some((action) => !ACTIONS.has(action))
  ) {
    fail("PUBLIC_FORM_DEFINITION_INVALID");
  }

  const fieldCodes = new Set<string>();
  for (const field of definition.fields) {
    if (
      !isPlainRecord(field as unknown) ||
      !IDENTIFIER.test(field.fieldCode) ||
      fieldCodes.has(field.fieldCode)
    ) {
      fail("PUBLIC_FORM_FIELD_INVALID");
    }
    fieldCodes.add(field.fieldCode);
  }

  for (const field of definition.fields) {
    if (
      !Number.isSafeInteger(field.step) ||
      field.step < 1 ||
      field.step > 12 ||
      typeof field.required !== "boolean" ||
      !CONTENT_ID.test(field.labelId) ||
      (field.helpTextId !== undefined && !CONTENT_ID.test(field.helpTextId)) ||
      (field.maxLength !== undefined &&
        (!Number.isSafeInteger(field.maxLength) || field.maxLength < 1 || field.maxLength > 2_000)) ||
      (field.minimum !== undefined && !Number.isFinite(field.minimum)) ||
      (field.maximum !== undefined && !Number.isFinite(field.maximum)) ||
      (field.minimum !== undefined && field.maximum !== undefined && field.minimum > field.maximum) ||
      (field.optionCodes !== undefined &&
        (field.optionCodes.length < 1 ||
          new Set(field.optionCodes).size !== field.optionCodes.length ||
          field.optionCodes.some((option: string) => !IDENTIFIER.test(option))))
    ) {
      fail("PUBLIC_FORM_FIELD_INVALID");
    }
    if (
      !SAFE_SENSITIVITIES.has(field.sensitivity) &&
      !(
        field.sensitivity === "financial" &&
        COARSE_FINANCIAL_FIELDS.has(field.fieldCode) &&
        (field.fieldType === "select" || field.fieldType === "radio") &&
        field.optionCodes !== undefined
      )
    ) {
      fail("PUBLIC_FIELD_SENSITIVITY_FORBIDDEN");
    }
    if (field.visibleWhen !== undefined) validateCondition(field.visibleWhen, fieldCodes);
  }
}

function conditionSignature(condition: ConditionNode | undefined): unknown {
  if (!condition) return null;
  if (condition.operator === "equals") {
    return [condition.operator, condition.fieldCode, condition.value];
  }
  if (condition.operator === "present") return [condition.operator, condition.fieldCode];
  if (condition.operator === "not") return [condition.operator, conditionSignature(condition.condition)];
  return [condition.operator, condition.conditions.map(conditionSignature)];
}

function paritySignature(definition: FormDefinitionVersion): string {
  return JSON.stringify({
    formCode: definition.formCode,
    version: definition.version,
    purpose: definition.purpose,
    serviceCode: definition.serviceCode ?? null,
    retentionClass: definition.retentionClass,
    disclosureReferences: definition.disclosureReferences,
    approvedActions: definition.approvedActions,
    fields: definition.fields.map((field) => ({
      fieldCode: field.fieldCode,
      fieldType: field.fieldType,
      step: field.step,
      required: field.required,
      sensitivity: field.sensitivity,
      optionCodes: field.optionCodes ?? null,
      minimum: field.minimum ?? null,
      maximum: field.maximum ?? null,
      maxLength: field.maxLength ?? null,
      visibleWhen: conditionSignature(field.visibleWhen),
    })),
  });
}

export function validatePublishedDefinition(
  definition: PublishedFormDefinition,
): PublishedFormDefinition {
  if (!isPlainRecord(definition)) fail("PUBLIC_FORM_DEFINITION_INVALID");
  validateVersion(definition.es, "es");
  validateVersion(definition.en, "en");
  if (paritySignature(definition.es) !== paritySignature(definition.en)) {
    fail("LOCALE_PARITY_REQUIRED");
  }
  return definition;
}

function isPresent(value: PublicAnswerValue | undefined): boolean {
  return value !== undefined && (typeof value !== "string" || value.trim().length > 0);
}

function evaluateCondition(
  condition: ConditionNode,
  answers: Readonly<Record<string, PublicAnswerValue>>,
): boolean {
  if (condition.operator === "equals") return answers[condition.fieldCode] === condition.value;
  if (condition.operator === "present") return isPresent(answers[condition.fieldCode]);
  if (condition.operator === "not") return !evaluateCondition(condition.condition, answers);
  if (condition.operator === "all") {
    return condition.conditions.every((child) => evaluateCondition(child, answers));
  }
  return condition.conditions.some((child) => evaluateCondition(child, answers));
}

export function evaluateVisibility(
  definition: FormDefinitionVersion,
  answers: Readonly<Record<string, PublicAnswerValue>>,
): FormVisibility {
  const visible: string[] = [];
  const hidden: string[] = [];
  for (const field of definition.fields) {
    (field.visibleWhen === undefined || evaluateCondition(field.visibleWhen, answers)
      ? visible
      : hidden
    ).push(field.fieldCode);
  }
  return Object.freeze({ visible: Object.freeze(visible), hidden: Object.freeze(hidden) });
}

export function publicDefinitionStructure(definition: FormDefinitionVersion): readonly string[] {
  return Object.freeze(definition.fields.map((field) => field.fieldCode));
}
