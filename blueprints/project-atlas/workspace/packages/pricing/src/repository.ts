import type { PromotionCode, PromotionRedemption } from "./contracts.ts";
import { deepFreeze } from "./policy.ts";

export class MemoryPricingRepository {
  readonly redemptions = new Map<string, PromotionRedemption>();
  private readonly operationIndex = new Map<string, string>();

  getByOperation(key: string): PromotionRedemption | undefined {
    const id = this.operationIndex.get(key);
    return id === undefined ? undefined : this.redemptions.get(id);
  }

  save(key: string, value: PromotionRedemption): void {
    this.operationIndex.set(key, value.id);
    this.redemptions.set(value.id, value);
  }

  replace(value: PromotionRedemption): void {
    this.redemptions.set(value.id, value);
  }

  countActive(codeId: string, clientId?: string | null): number {
    return [...this.redemptions.values()].filter(
      (item) =>
        item.promotionCodeId === codeId &&
        (clientId === undefined || item.clientId === clientId) &&
        ["reserved", "applied", "consumed"].includes(item.status),
    ).length;
  }
}

function key(code: PromotionCode, operationId: string, clientId: string | null): string {
  return `${code.id}:${operationId}:${clientId ?? "anonymous"}`;
}

export function reservePromotionRedemption(
  repository: MemoryPricingRepository,
  input: Readonly<{
    promotionCode: PromotionCode;
    operationId: string;
    clientId: string | null;
    organizationId: string | null;
    reservedAt: string;
    expiresAt: string | null;
  }>,
) {
  const operationKey = key(input.promotionCode, input.operationId, input.clientId);
  const existing = repository.getByOperation(operationKey);
  if (existing !== undefined)
    return deepFreeze({ status: "reserved" as const, idempotent: true, redemption: existing });
  const blocked =
    input.promotionCode.status !== "active" ||
    (input.promotionCode.maximumUses !== null &&
      repository.countActive(input.promotionCode.id) >= input.promotionCode.maximumUses) ||
    (input.promotionCode.maximumUsesPerClient !== null &&
      repository.countActive(input.promotionCode.id, input.clientId) >=
        input.promotionCode.maximumUsesPerClient);
  const redemption = deepFreeze({
    id: `promotion-redemption-${input.operationId}`,
    promotionCodeId: input.promotionCode.id,
    operationId: input.operationId,
    clientId: input.clientId,
    organizationId: input.organizationId,
    status: blocked ? ("rejected" as const) : ("reserved" as const),
    reservedAt: input.reservedAt,
    expiresAt: input.expiresAt,
    consumedAt: null,
  });
  if (!blocked) repository.save(operationKey, redemption);
  return deepFreeze({
    status: blocked ? ("blocked" as const) : ("reserved" as const),
    idempotent: false,
    redemption,
  });
}

export function consumePromotionRedemption(
  repository: MemoryPricingRepository,
  redemptionId: string,
  consumedAt: string,
): PromotionRedemption {
  const current = repository.redemptions.get(redemptionId);
  if (current === undefined) throw new TypeError("promotion redemption not found");
  if (current.status === "consumed") return current;
  if (current.status !== "reserved" && current.status !== "applied")
    throw new TypeError("promotion redemption cannot be consumed");
  const consumed = deepFreeze({ ...current, status: "consumed" as const, consumedAt });
  repository.replace(consumed);
  return consumed;
}
