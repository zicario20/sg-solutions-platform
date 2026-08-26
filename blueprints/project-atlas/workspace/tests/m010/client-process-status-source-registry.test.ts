import {
  createProcessSourceRegistry,
  REQUIRED_PROCESS_SOURCE_CODES,
} from "@atlas/client-process-status";
import { describe, expect, it } from "vitest";

const policy = {
    version: "sources.v1",
    mappingPolicyVersion: "maps.v1",
    acceptedDefinitionVersions: ["def.v1"],
    acceptedWorkflowVersions: ["flow.v1"],
  },
  entry = (code: string, critical = true) => ({
    code,
    ownerVersion: `${code}.owner.v1`,
    critical,
    freshnessMs: 60000,
    highestPriorityBand: 7,
  });
describe("M010 closed registry criticality", () => {
  it("starts disabled and rejects unknown owners", () => {
    expect(createProcessSourceRegistry().entries).toEqual([]);
    expect(() =>
      createProcessSourceRegistry([{ ...entry("unknown"), code: "unknown" }] as never, policy),
    ).toThrow();
  });
  it.each(REQUIRED_PROCESS_SOURCE_CODES)(
    "rejects required source %s declared noncritical",
    (code) => {
      const entries = REQUIRED_PROCESS_SOURCE_CODES.map((value) => entry(value, value !== code));
      expect(() => createProcessSourceRegistry(entries as never, policy)).toThrow(
        "PROCESS_SOURCE_REGISTRY_INVALID",
      );
    },
  );
  it("rejects an all-noncritical required set", () => {
    expect(() =>
      createProcessSourceRegistry(
        REQUIRED_PROCESS_SOURCE_CODES.map((code) => entry(code, false)) as never,
        policy,
      ),
    ).toThrow();
  });
  it("allows optional sources to remain noncritical", () => {
    const value = createProcessSourceRegistry(
      [...REQUIRED_PROCESS_SOURCE_CODES.map((code) => entry(code)), entry("help", false)] as never,
      policy,
    );
    expect(value.entries.find((item) => item.code === "help")?.critical).toBe(false);
    expect(
      REQUIRED_PROCESS_SOURCE_CODES.every(
        (code) => value.entries.find((item) => item.code === code)?.critical === true,
      ),
    ).toBe(true);
  });
});
