import { describe, expect, it } from "vitest";
import {
  assessSourceFreshness,
  captureSourceSnapshot,
  createSourceRecord,
  createSourceVersion,
  isSourceManagementRuntimeEnabled
} from "../../packages/source-management/src/index.ts";

const source = () => createSourceRecord({
  sourceCode: "IRS_GUIDANCE",
  displayName: "IRS guidance",
  sourceType: "government",
  authorityClass: "government",
  canonicalLocation: "https://www.irs.gov/example",
  accessClassification: "public",
  jurisdictions: ["US"]
});
const snapshot = () => captureSourceSnapshot({
  version: createSourceVersion({
    record: source(),
    versionCode: "2026_01",
    publisherReference: "publisher:irs",
    publishedAt: null,
    effectiveFrom: null,
    effectiveTo: null,
    applicabilityReference: "applicability:us"
  }),
  checksum: "sha256:example",
  retrievedAt: "2026-08-28T00:00:00.000Z",
  payloadReference: "source-payload:example",
  integrityStatus: "verified"
});

describe("M064 Source Management", () => {
  it("creates immutable, unpromoted snapshots", () => {
    expect(snapshot().immutable).toBe(true);
    expect(snapshot().promotedCurrent).toBe(false);
  });
  it("does not treat stale evidence as current", () => {
    expect(assessSourceFreshness(snapshot(), "stale").status).toBe("stale");
    expect(assessSourceFreshness(snapshot(), "stale").materialUseAllowed).toBe(false);
  });
  it("keeps provider activity disabled", () => {
    expect(isSourceManagementRuntimeEnabled()).toBe(false);
  });
});
