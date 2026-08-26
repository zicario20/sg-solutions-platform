import postgres from "postgres";
import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

export function createPostgresAuthSql(databaseUrl: string): AuthSql {
  if (!/^postgres(?:ql)?:\/\//u.test(databaseUrl)) throw new Error("AUTH_DATABASE_URL_DENIED");
  const client = postgres(databaseUrl, { max: 4, prepare: true });
  return {
    begin: async <T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> =>
      await (client.begin((transaction) =>
        callback({
          unsafe: async <R>(statement: string, parameters: readonly unknown[] = []) =>
            (await transaction.unsafe(statement, [...parameters] as never[])) as unknown as R,
        }),
      ) as unknown as Promise<T>),
  };
}
