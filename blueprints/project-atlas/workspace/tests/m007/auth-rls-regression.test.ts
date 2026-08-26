import { withAuthTransaction } from "@atlas/database";
import { describe, expect, it } from "vitest";

describe("M007 restricted-role RLS boundary", () => {
  it("rejects an operation before it can set a session context without an active server session", async () => {
    const sql = {
      begin: async <T>(
        operation: (transaction: {
          unsafe<T>(query: string, parameters?: readonly unknown[]): Promise<T>;
        }) => Promise<T>,
      ) => operation({ unsafe: async () => [] as never }),
    };
    await expect(withAuthTransaction(sql, "", async () => undefined)).rejects.toThrow(
      "AUTH_SESSION_REQUIRED",
    );
  });
});
