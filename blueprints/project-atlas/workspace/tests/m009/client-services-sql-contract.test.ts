import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(import.meta.dirname, "../../drizzle/0037_m009_client_services.sql"),
  "utf8",
).toLowerCase();
describe("M009 SQL contract", () => {
  it("uses canonical owners, complete RLS and no seeds", () => {
    expect(sql).toContain("create table public.service_orders");
    expect(sql).toContain("create table public.client_service_read_models");
    expect(sql).toContain("foreign key (service_order_id, account_id, context_opaque_ref)");
    expect(sql.match(/enable row level security/g)?.length).toBe(8);
    expect(sql).toContain("create policy client_service_grant_scope");
    expect(sql).not.toMatch(/insert\s+into\s+public\./);
  });
});
