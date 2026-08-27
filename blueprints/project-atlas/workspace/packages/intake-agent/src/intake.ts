import type {
  IntakeAnswerRecord,
  IntakeDataClassification,
  IntakeEnteredByType,
  IntakeSourceType,
  IntakeVerificationStatus,
  ReceptionIntakeSessionInput,
  IntakeSession,
} from "./contracts.js";

function deriveVerificationStatus(sourceType: IntakeSourceType): IntakeVerificationStatus {
  switch (sourceType) {
    case "user_entered":
      return "user_asserted";
    case "staff_entered_on_behalf":
      return "staff_entered_on_behalf";
    case "document_extracted":
      return "document_extracted_unconfirmed";
    case "provider_imported":
      return "provider_supported";
    case "specialist_verified":
      return "specialist_reviewed";
    case "system_derived":
    case "migration_imported":
      return "unknown";
  }
}

function isReference(value: string): boolean {
  return value.includes(":") || value.startsWith("vault://");
}

export function createIntakeAnswerRecord(input: {
  readonly id?: string;
  readonly intakeSessionId: string;
  readonly participantId: string;
  readonly fieldCode: string;
  readonly fieldVersion: string;
  readonly answerValueReference: string;
  readonly sourceType: IntakeSourceType;
  readonly sourceReference?: string;
  readonly enteredByType: IntakeEnteredByType;
  readonly enteredByReference?: string;
  readonly dataClassification: IntakeDataClassification;
  readonly createdAt?: string;
  readonly supersedesAnswerReference?: string;
}): IntakeAnswerRecord {
  if (!isReference(input.answerValueReference)) {
    throw new Error("M050 accepts an opaque answer-value reference, never a raw answer value.");
  }
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    id:
      input.id ??
      "intake-answer:" +
        input.intakeSessionId +
        ":" +
        input.participantId +
        ":" +
        input.fieldCode +
        ":" +
        input.fieldVersion,
    intakeSessionId: input.intakeSessionId,
    participantId: input.participantId,
    fieldCode: input.fieldCode,
    fieldVersion: input.fieldVersion,
    answerValueReference: input.answerValueReference,
    answerStatus: "answered",
    verificationStatus: deriveVerificationStatus(input.sourceType),
    sourceType: input.sourceType,
    sourceReference: input.sourceReference,
    enteredByType: input.enteredByType,
    enteredByReference: input.enteredByReference,
    dataClassification: input.dataClassification,
    createdAt,
    updatedAt: createdAt,
    supersedesAnswerReference: input.supersedesAnswerReference,
  };
}

export type IntakeNormalizationResult =
  | {
      readonly status: "normalized";
      readonly normalizedValue: string;
      readonly normalizationPolicyVersion: "m050-safe-normalization-v1";
    }
  | {
      readonly status: "not_normalized";
      readonly reasonCode:
        | "material_field_requires_user_assertion"
        | "unsupported_safe_normalization";
    }
  | {
      readonly status: "blocked";
      readonly reasonCode: "highly_sensitive_identifier_not_normalized";
    };

export function normalizeSafeIntakeValue(input: {
  readonly fieldCode: string;
  readonly value: string;
}): IntakeNormalizationResult {
  const fieldCode = input.fieldCode.trim().toLowerCase();
  if (fieldCode === "ssn" || fieldCode === "ein" || fieldCode === "tax_identifier") {
    return {
      status: "blocked",
      reasonCode: "highly_sensitive_identifier_not_normalized",
    };
  }
  if (fieldCode === "legal_name" || fieldCode === "business_legal_name") {
    return {
      status: "not_normalized",
      reasonCode: "material_field_requires_user_assertion",
    };
  }
  if (fieldCode === "email") {
    return {
      status: "normalized",
      normalizedValue: input.value.trim().toLowerCase(),
      normalizationPolicyVersion: "m050-safe-normalization-v1",
    };
  }
  if (fieldCode === "phone") {
    const digits = input.value.replace(/\D/g, "");
    const normalizedValue = digits.length === 10 ? "+1" + digits : "+" + digits;
    return {
      status: "normalized",
      normalizedValue,
      normalizationPolicyVersion: "m050-safe-normalization-v1",
    };
  }
  if (fieldCode === "state" || fieldCode === "country") {
    return {
      status: "normalized",
      normalizedValue: input.value.trim().toUpperCase(),
      normalizationPolicyVersion: "m050-safe-normalization-v1",
    };
  }
  if (fieldCode === "date") {
    const parsed = new Date(input.value);
    if (!Number.isNaN(parsed.valueOf())) {
      return {
        status: "normalized",
        normalizedValue: parsed.toISOString().slice(0, 10),
        normalizationPolicyVersion: "m050-safe-normalization-v1",
      };
    }
  }
  return {
    status: "not_normalized",
    reasonCode: "unsupported_safe_normalization",
  };
}

export function createReceptionIntakeSession(input: ReceptionIntakeSessionInput): IntakeSession {
  if (input.receptionHandoff.target !== "intake_agent") {
    throw new Error("M050 only accepts a prepared M049 handoff targeted to intake_agent.");
  }
  if (input.receptionHandoff.executionPermitted) {
    throw new Error("M050 refuses reception handoffs marked executable.");
  }
  return {
    id: input.id,
    intakeDefinitionReference: input.intakeDefinitionReference,
    surface: "public_pre_intake",
    mode: "public_pre_intake",
    locale: input.locale,
    status: "created",
    openedAt: input.createdAt,
    lastActivityAt: input.createdAt,
    expiresAt: input.expiresAt,
    highlySensitiveCollectionPermitted: false,
    sourceHandoffReference: input.receptionHandoff.id,
  };
}
