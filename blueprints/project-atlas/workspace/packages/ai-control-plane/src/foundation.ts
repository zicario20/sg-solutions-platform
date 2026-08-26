export const AI_HUB_PROHIBITED_ACTIONS = new Set([
  "publish_service",
  "change_price",
  "approve_service_start",
  "grant_entitlement",
  "issue_refund",
  "submit_filing",
  "submit_tax_return",
  "send_credit_dispute",
  "apply_for_loan",
  "share_documents_without_consent",
  "change_payment_status",
  "approve_financial_product",
]);

const instructionLike =
  /ignore\s+(all\s+)?previous\s+instructions|reveal\s+(the\s+)?system\s+prompt|bypass\s+(policy|approval|permission)|disable\s+(safety|guardrail)/iu;

export function deepFreeze<T>(value: T): T {
  return Object.freeze(structuredClone(value));
}

export function assertText(value: string, label: string, maximum = 500): string {
  if (value.trim().length === 0 || value.length > maximum) throw new TypeError(`${label} invalid`);
  return value;
}

export function assertIso(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z"))
    throw new TypeError(`${label} invalid`);
  return value;
}

export function assertPositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) throw new TypeError(`${label} invalid`);
  return value;
}

export function assertExactVersionReference(value: string, label: string): string {
  assertText(value, label, 240);
  if (value.toLowerCase() === "latest" || !/@(?:[1-9]\d*|v?[\w.-]+)$/u.test(value))
    throw new TypeError(`${label} requires exact version`);
  return value;
}

export function assertNoPrivateReasoning(value: string, label: string): string {
  if (/chain[_ -]?of[_ -]?thought|private[_ -]?reasoning|reasoning[_ -]?trace/iu.test(value))
    throw new TypeError(`${label} cannot contain chain-of-thought`);
  return value;
}

export function assertNoInstructionInjection(value: string): string {
  if (instructionLike.test(value)) throw new TypeError("untrusted instruction detected");
  return value;
}

export function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
