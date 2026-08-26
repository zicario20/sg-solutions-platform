import { describe, expect, it } from "vitest";

import { POST } from "../../apps/app/src/app/api/integrations/stripe/webhook/route.ts";

describe("M043 Stripe webhook ingress", () => {
  it("fails closed while the controlled Stripe provider remains disabled", async () => {
    const environment = process.env as Record<string, string | undefined>;
    const keys = {
      m014: "M014_PAYMENTS_ENABLED",
      m043: "M043_STRIPE_PAYMENTS_ENABLED",
      ingress: "M043_STRIPE_WEBHOOK_INGRESS_ENABLED",
      secret: "STRIPE_WEBHOOK_SECRET",
    } as const;
    const original = {
      m014: environment[keys.m014],
      m043: environment[keys.m043],
      ingress: environment[keys.ingress],
      secret: environment[keys.secret],
    };
    environment[keys.m014] = "false";
    environment[keys.m043] = "false";
    environment[keys.ingress] = "false";
    environment[keys.secret] = "";

    try {
      const response = await POST(
        new Request("http://localhost/api/integrations/stripe/webhook", {
          method: "POST",
          body: '{"id":"evt_test"}',
        }),
      );

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ error: "temporarily_unavailable" });
    } finally {
      restore(environment, keys.m014, original.m014);
      restore(environment, keys.m043, original.m043);
      restore(environment, keys.ingress, original.ingress);
      restore(environment, keys.secret, original.secret);
    }
  });
});

function restore(
  environment: Record<string, string | undefined>,
  name: string,
  value: string | undefined,
): void {
  if (value === undefined) {
    delete environment[name];
    return;
  }
  environment[name] = value;
}
