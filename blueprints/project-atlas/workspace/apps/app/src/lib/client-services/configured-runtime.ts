import {
  type ClientServiceSectionPorts,
  ClientServicesQueryService,
  type ClientServicesSourcePort,
} from "@atlas/client-services";
import type { DashboardAuthPort } from "@atlas/dashboard";
import type { AuthSql } from "@atlas/database";

import {
  createM007DashboardAuthPort,
  type M007DashboardAuthRepository,
} from "../dashboard/m007-auth-adapter.ts";
import { createPostgresM007DashboardAuthRepository } from "../dashboard/m007-dashboard-repository.ts";
import type { ClientServicesAdmissionAction, ClientServicesAdmissionPort } from "./admission.ts";
import { createM007M008ClientServicesAuthAdapter } from "./auth-adapter.ts";
import type { ClientServicesHttpDependencies } from "./http.ts";
import {
  type ClientServicesSqlPort,
  createPostgresClientServicesSource,
} from "./postgres-repository.ts";

type PostgresTransaction = {
  unsafe<T extends readonly Record<string, unknown>[]>(
    text: string,
    values: readonly unknown[],
  ): Promise<T>;
};
type PostgresClient = {
  begin<T>(work: (transaction: PostgresTransaction) => Promise<T>): Promise<T>;
};

export interface ClientServicesRuntimeConfiguration {
  admission: ClientServicesAdmissionPort;
  authPort: DashboardAuthPort;
  source: ClientServicesSourcePort;
  sections?: ClientServiceSectionPorts;
}

export interface ClientServicesRuntimeDependencies {
  authRepository?: M007DashboardAuthRepository;
  source?: ClientServicesSourcePort;
  admission?: ClientServicesAdmissionPort;
  sections?: ClientServiceSectionPorts;
}

export function createConfiguredClientServicesRuntime(
  configuration?: ClientServicesRuntimeConfiguration,
): ClientServicesHttpDependencies {
  if (!configuration) return { admit: async () => false };

  const query = new ClientServicesQueryService({
    auth: createM007M008ClientServicesAuthAdapter(configuration.authPort),
    source: configuration.source,
    sections: configuration.sections ?? {},
    ownerTimeoutMs: 500,
  });

  return {
    admit: (action: ClientServicesAdmissionAction, request: Request) =>
      configuration.admission.admit({ action, request }),
    query,
  };
}

export function createM007M008ClientServicesRuntime(
  configuration: ClientServicesRuntimeConfiguration,
) {
  return createConfiguredClientServicesRuntime(configuration);
}

async function databaseSource(url: string) {
  const name = "postgres";
  const module = (await import(name)) as {
    default: (url: string, options: { max: number; prepare: boolean }) => PostgresClient;
  };
  const client = module.default(url, { max: 4, prepare: false });
  const sql: ClientServicesSqlPort = {
    transaction: async (work) =>
      client.begin(async (transaction) =>
        work({
          query: async <T extends Record<string, unknown>>(
            text: string,
            values: readonly unknown[],
          ) => transaction.unsafe<readonly T[]>(text, values),
        }),
      ),
  };

  return createPostgresClientServicesSource(sql);
}

export async function createEnvironmentClientServicesRuntime(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  dependencies: ClientServicesRuntimeDependencies = {},
): Promise<ClientServicesHttpDependencies> {
  const url = environment.DATABASE_URL ?? "";
  const contextSecret = environment.DASHBOARD_CONTEXT_HMAC_KEY ?? "";
  const databaseRole = environment.M009_DATABASE_ROLE ?? "";
  const enabled =
    environment.M009_CLIENT_SERVICES_ENABLED === "true" &&
    databaseRole === "atlas_client_services_reader" &&
    /^postgres(?:ql)?:/; //u.test(url) &&
  contextSecret.length >= 32;

  if (!enabled || !dependencies.admission) return createConfiguredClientServicesRuntime();

  try {
    let repository = dependencies.authRepository;
    if (!repository) {
      const name = "@atlas/database";
      const database = (await import(name)) as {
        createPostgresAuthSql: (url: string) => AuthSql;
      };
      repository = createPostgresM007DashboardAuthRepository(database.createPostgresAuthSql(url));
    }

    const authPort = createM007DashboardAuthPort(repository, contextSecret);
    const source = dependencies.source ?? (await databaseSource(url));

    return createConfiguredClientServicesRuntime({
      admission: dependencies.admission,
      authPort,
      source,
      sections: dependencies.sections,
    });
  } catch {
    return createConfiguredClientServicesRuntime();
  }
}

export function getConfiguredClientServicesRuntime() {
  return createEnvironmentClientServicesRuntime();
}
