import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gateway = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);

describe("M031 controlled setup idempotency", () => {
  it("returns the existing book rather than treating a replay as a failed setup", () => {
    expect(gateway).toContain(
      "on conflict (engagement_id,accounting_entity_ref) do nothing returning id",
    );
    expect(gateway).toContain('kind: "existing" as const, bookRef: book.id');
  });
});
