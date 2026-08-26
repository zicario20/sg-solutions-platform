import { describe, expect, it } from "vitest";
import { createClientServicesAnalyticsEvent } from "../../packages/observability/src/client-services";

describe("M009 operational health metrics", () => {
  it("allows only health metadata", () => {
    expect(
      createClientServicesAnalyticsEvent("client_services_health_list", {
        locale: "es",
        outcome: "available",
        filterUsed: true,
      }),
    ).toMatchObject({ event: "client_services_health_list" });
    expect(() =>
      createClientServicesAnalyticsEvent("client_services_health_detail", {
        locale: "en",
        outcome: "available",
        serviceRef: "x",
      } as never),
    ).toThrow();
  });
});
