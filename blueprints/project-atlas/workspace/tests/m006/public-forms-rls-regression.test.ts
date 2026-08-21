import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  withAttestedPublicFormsStaffRole,
  type PublicFormsSql,
} from "../../packages/database/src/public-forms-repository.ts";

describe("M006 attested staff RLS", () => {
  it("selects a fixed least-privilege role only after database membership attestation", async () => {
    const statements: string[] = [];
    const sql: PublicFormsSql = {
      async begin(work) {
        return work({
          async unsafe(statement, parameters) {
            statements.push(statement.replace(/\s+/gu, " ").trim());
            if (statement.includes("pg_has_role")) {
              return [{
                session_user_name: "atlas_staff_runtime",
                is_member: parameters?.[0] === "atlas_public_forms_preview",
                rolsuper: false,
                rolbypassrls: false,
              }] as never;
            }
            return [] as never;
          },
        });
      },
    };

    await expect(withAttestedPublicFormsStaffRole(sql, "preview", async () => "allowed")).resolves.toBe(
      "allowed",
    );
    expect(statements).toContain("set local role atlas_public_forms_preview");
    await expect(withAttestedPublicFormsStaffRole(sql, "review", async () => "forbidden")).rejects.toThrowError(
      "PUBLIC_FORMS_STAFF_ROLE_DENIED",
    );
    expect(statements.join("\n")).not.toContain("atlas.staff_permission");
  });

  it("generates a forward migration with separated roles and no self-asserted permission GUC", () => {
    const drizzle = resolve(process.cwd(), "drizzle");
    const migrations = readdirSync(drizzle)
      .filter((name) => /^0020_.+\.sql$/u.test(name))
      .map((name) => readFileSync(resolve(drizzle, name), "utf8"));

    expect(migrations).toHaveLength(1);
    const migration = migrations[0] ?? "";
    expect(migration).not.toContain("atlas.staff_permission");
    expect(migration).toContain('TO "atlas_public_forms_preview"');
    expect(migration).toContain('TO "atlas_public_forms_review"');
    expect(migration).toContain('TO "atlas_public_forms_export"');
    expect(migration).toContain('CREATE TABLE "form_consent_revocations"');
    expect(migration).toContain('"max_attempts" integer DEFAULT 3 NOT NULL');
    expect(migration).toContain('"owner_receipt" jsonb');
  });
});
