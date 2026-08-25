import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gateway = readFileSync("packages/database/src/postgres-bookkeeping.ts", "utf8");
const migration = readFileSync("drizzle/0038_m031_controlled_bookkeeping.sql", "utf8");

describe("M031 bookkeeping outbox recovery", () => {
  it("claims pending events with a row lock and bounded attempts", () => {
    expect(migration).toContain("attempt_count");
    expect(gateway).toContain("async claimPendingOutbox");
    expect(gateway).toContain("for update skip locked");
    expect(gateway).toContain("attempt_count<3");
  });

  it("requeues a transient delivery failure until the bounded attempt limit", () => {
    const settleMethod =
      gateway
        .split("async settleOutboxEvent", 2)[1]
        ?.split("async recoverStaleOutboxProcessing", 1)[0] ?? "";

    expect(gateway).toContain("async settleOutboxEvent");
    expect(settleMethod).toContain('"delivered"');
    expect(settleMethod).toContain('"failed"');
    expect(settleMethod).toMatch(/when attempt_count>=3 then 'failed'\s+else 'pending'/u);
    expect(settleMethod).toContain("claimed_at=null");
    expect(gateway).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });

  it("bounds retries and recovers only stale claims", () => {
    expect(gateway).toContain("async recoverStaleOutboxProcessing");
    expect(gateway).toContain("attempt_count>=3");
    expect(gateway).toContain("claimed_at<");
    expect(gateway).toContain("state='pending'");
  });
});
