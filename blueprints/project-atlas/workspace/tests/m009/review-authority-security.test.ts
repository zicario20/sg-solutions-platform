import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createClientServiceOpaqueRef, isClientServiceAuthorized } from "@atlas/client-services";

const sql = readFileSync(resolve(import.meta.dirname, "../../drizzle/0037_m009_client_services.sql"), "utf8").toLowerCase();
const repository = readFileSync(resolve(import.meta.dirname, "../../apps/app/src/lib/client-services/postgres-repository.ts"), "utf8").toLowerCase();
const runtime = readFileSync(resolve(import.meta.dirname, "../../apps/app/src/lib/client-services/configured-runtime.ts"), "utf8").toLowerCase();

describe("M009 authority and security remediation", () => {
  it("uses ServiceOrder owners, a rebuildable read model and scoped non-bypass RLS", () => {
    expect(sql).toContain("create table public.service_orders");
    expect(sql).toContain("create table public.service_definition_versions");
    expect(sql).toContain("create table public.client_service_read_models");
    expect(sql).toContain("nologin nobypassrls");
    expect(sql).toContain("create policy");
    expect(sql).toContain("to atlas_client_services_reader");
    expect(sql).toContain("p.account_id = g.account_id");
    expect(repository).toContain("from public.service_orders");
    expect(repository).toContain("transaction_timestamp()");
    expect(repository).not.toContain("$1::uuid");
  });

  it("fences all mutable owner facts, binds read-model versions and forces the restricted role", () => {
    for (const owner of ["financial", "activation", "fulfillment"]) {
      expect(repository).toContain(`${owner}_source_version`);
      expect(repository).toContain(`${owner}_resource_epoch`);
      expect(repository).toContain(`m.${owner}_source_version`);
    }
    expect(repository).toContain("set local role atlas_client_services_reader");
    expect(runtime).toContain("m009_database_role");
    expect(runtime).toContain('==="atlas_client_services_reader"');
  });

  it("applies the authoritative status predicate before LIMIT so later matching rows remain eligible", () => {
    expect(repository).toContain("async list({ snapshot, query, status, limit })");
    const predicate = repository.indexOf("$6::text is null");
    const limit = repository.indexOf("limit $7");
    expect(predicate).toBeGreaterThan(-1);
    expect(limit).toBeGreaterThan(predicate);
  });

  it("rejects mismatched, expired and epoch-incompatible grants", () => {
    const snapshot = { accountId: "acct-text", authorizationEpoch: 5, policyEpoch: 6, context: { opaqueRef: "ctx" }, accountStatus: "active", sessionStatus: "active", sessionExpiresAt: "2026-08-22T00:00:00.000Z" } as never;
    const base = { ownerAccountId: "acct-text", ownerContextOpaqueRef: "ctx", resourceEpoch: 7, grant: { permission: "client.service.read", state: "active", accountId: "acct-text", contextOpaqueRef: "ctx", authorizationEpoch: 5, policyEpoch: 6, resourceEpoch: 7, expiresAt: "2026-08-22T00:00:00.000Z" } } as never;
    expect(isClientServiceAuthorized(snapshot, base, new Date("2026-08-21T12:00:00Z"))).toBe(true);
    expect(isClientServiceAuthorized(snapshot, { ...base, ownerAccountId: "other" } as never, new Date("2026-08-21T12:00:00Z"))).toBe(false);
    expect(isClientServiceAuthorized(snapshot, { ...base, grant: { ...(base as any).grant, authorizationEpoch: 4 } } as never, new Date("2026-08-21T12:00:00Z"))).toBe(false);
    expect(isClientServiceAuthorized(snapshot, base, new Date("2026-08-22T00:00:00Z"))).toBe(false);
  });

  it("generates versioned, purpose-bound, non-sequential opaque references", () => {
    const refs = new Set(Array.from({ length: 128 }, () => createClientServiceOpaqueRef()));
    expect(refs.size).toBe(128);
    for (const ref of refs) expect(ref).toMatch(/^csr1_[A-Za-z0-9_-]{32}$/);
    expect([...refs].join(" ")).not.toContain("service-order-1");
  });
});
