import { verifySessionCsrfToken } from "@atlas/auth";
import {
  type ClientDashboardQueryRequest,
  type ClientDashboardQueryResult,
  ClientDashboardQueryService,
  DASHBOARD_OWNER_CODES,
  type DashboardOwnerPorts,
  selectDashboardContext,
} from "@atlas/dashboard";
import { type AuthSql, createPostgresAuthSql } from "@atlas/database";
import type { DashboardEvent } from "@atlas/observability";
import { createEnvironmentClientServicesRuntime } from "../client-services/configured-runtime.ts";
import {
  createClientServicesDashboardOwnerPort,
  loadAuthorizedClientServicesDashboardFragment,
} from "../client-services/dashboard-adapter.ts";
import type { ClientServicesHttpDependencies } from "../client-services/http.ts";
import { createUnavailableDashboardAuthPort } from "./auth-context.ts";
import {
  buildDashboardTrustedRateKeys,
  type DashboardAdmissionResult,
  type DashboardRateAction,
} from "./dashboard-admission.ts";
import {
  createM007DashboardAuthPort,
  type M007DashboardAuthRepository,
} from "./m007-auth-adapter.ts";
import { createPostgresM007DashboardAuthRepository } from "./m007-dashboard-repository.ts";
import { createUnavailableDashboardOwnerPorts } from "./owner-ports.ts";

export type DashboardHttpDependencies = Readonly<{
  canonicalOrigin: string;
  defaultLocale?: string;
  query(input: ClientDashboardQueryRequest): Promise<ClientDashboardQueryResult>;
  selectContext(
    input: Readonly<{ sessionHandle: string; requestedContext: string }>,
  ): Promise<Readonly<{ kind: "selected"; contextHandle: string }> | Readonly<{ kind: "denied" }>>;
  resolveMessagingActor(input: ClientDashboardQueryRequest): Promise<
    | Readonly<{
        kind: "authorized";
        actor: Readonly<{
          accountId: string;
          contextRef: string;
          contextType: "personal" | "organization";
          assurance: "aal1" | "aal2";
          authorizationEpoch: string;
          policyEpoch: string;
        }>;
      }>
    | Readonly<{ kind: "denied" }>
  >;
  verifyCsrf(sessionHandle: string, token: string): boolean;
  admit?(action: DashboardRateAction, request: Request): Promise<DashboardAdmissionResult>;
  emitAnalytics?(event: DashboardEvent): Promise<void> | void;
}>;
export type ConfiguredDependencies = Readonly<{
  authRepository?: M007DashboardAuthRepository;
  sql?: AuthSql;
  servicesOwnerPort?: DashboardOwnerPorts["services"];
  clientServicesRuntimeFactory?: (
    environment: Readonly<Record<string, string | undefined>>,
  ) => Promise<ClientServicesHttpDependencies>;
  emitAnalytics?: (event: DashboardEvent) => Promise<void> | void;
}>;
export function configuredDashboardOwnerStates(): Readonly<
  Record<(typeof DASHBOARD_OWNER_CODES)[number], "unavailable">
> {
  return Object.freeze(
    Object.fromEntries(DASHBOARD_OWNER_CODES.map((owner) => [owner, "unavailable"])) as Record<
      (typeof DASHBOARD_OWNER_CODES)[number],
      "unavailable"
    >,
  );
}
export function createConfiguredDashboardOwnerPorts(
  environment: Readonly<Record<string, string | undefined>>,
  dependencies: ConfiguredDependencies = {},
): DashboardOwnerPorts {
  if (dependencies.servicesOwnerPort)
    return createUnavailableDashboardOwnerPorts(dependencies.servicesOwnerPort);
  if (environment.M009_CLIENT_SERVICES_ENABLED !== "true")
    return createUnavailableDashboardOwnerPorts();
  const runtimeFactory =
    dependencies.clientServicesRuntimeFactory ?? createEnvironmentClientServicesRuntime;
  const services = createClientServicesDashboardOwnerPort(async ({ snapshot, signal, limit }) => {
    if (signal.aborted)
      return {
        state: "unavailable" as const,
        classification: "client_safe" as const,
        safeReason: "source_unavailable" as const,
      };
    const runtime = await runtimeFactory(environment);
    if (!runtime.query)
      return {
        state: "unavailable" as const,
        classification: "client_safe" as const,
        safeReason: "source_unavailable" as const,
      };
    return loadAuthorizedClientServicesDashboardFragment(
      runtime.query,
      snapshot as Parameters<typeof loadAuthorizedClientServicesDashboardFragment>[1],
      limit,
    );
  });
  return createUnavailableDashboardOwnerPorts(services as DashboardOwnerPorts["services"]);
}
export function createConfiguredDashboardRuntime(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  dependencies: ConfiguredDependencies = {},
): DashboardHttpDependencies {
  const canonicalOrigin = environment.AUTH_CANONICAL_ORIGIN ?? "";
  const csrfSecret = environment.AUTH_SESSION_CSRF_SECRET ?? "";
  const contextSecret = environment.DASHBOARD_CONTEXT_HMAC_KEY ?? "";
  const databaseUrl = environment.DATABASE_URL ?? "";
  const rateSecret = environment.DASHBOARD_RATE_HMAC_KEY ?? "";
  const trustProxy = environment.DASHBOARD_TRUST_PROXY_HEADERS === "true";
  const configured =
    /^https:\/\/[^/?#]+$/u.test(canonicalOrigin) &&
    csrfSecret.length >= 32 &&
    contextSecret.length >= 32 &&
    (!!dependencies.authRepository || /^postgres(?:ql)?:\/\//u.test(databaseUrl));
  const repository = configured
    ? (dependencies.authRepository ??
      createPostgresM007DashboardAuthRepository(
        dependencies.sql ?? createPostgresAuthSql(databaseUrl),
      ))
    : undefined;
  const authPort = repository
    ? createM007DashboardAuthPort(repository, contextSecret)
    : createUnavailableDashboardAuthPort();
  const queryService = new ClientDashboardQueryService({
    authPort,
    ownerPorts: createConfiguredDashboardOwnerPorts(environment, dependencies),
    timeoutMs: 500,
    maxConcurrency: 3,
  });
  return Object.freeze({
    canonicalOrigin,
    defaultLocale: environment.ATLAS_DEFAULT_LOCALE,
    query: queryService.query.bind(queryService),
    selectContext: (input) => selectDashboardContext(input, authPort),
    resolveMessagingActor: async (input) => {
      try {
        const decision = await authPort.authorize({ ...input, now: new Date() });
        if (decision.kind !== "authorized") return { kind: "denied" as const };
        const evidence = decision.evidence;
        return {
          kind: "authorized" as const,
          actor: {
            accountId: evidence.accountId,
            contextRef: evidence.context.opaqueRef,
            contextType: evidence.context.type,
            assurance: evidence.assurance,
            authorizationEpoch: evidence.authorizationEpoch,
            policyEpoch: evidence.policyEpoch,
          },
        };
      } catch {
        return { kind: "denied" as const };
      }
    },
    verifyCsrf: (sessionHandle, token) =>
      configured && verifySessionCsrfToken(csrfSecret, sessionHandle, token),
    admit: async (
      action: DashboardRateAction,
      request: Request,
    ): Promise<DashboardAdmissionResult> => {
      const keyDigests = buildDashboardTrustedRateKeys(request, action, {
        hmacKey: rateSecret,
        trustProxy,
      });
      if (!configured || !repository?.admitDashboard || keyDigests.length === 0)
        return "rate_limited";
      try {
        return (await repository.admitDashboard({ action, keyDigests, now: new Date() }))
          ? "accepted"
          : "rate_limited";
      } catch {
        return "rate_limited";
      }
    },
    emitAnalytics: dependencies.emitAnalytics,
  });
}
export async function loadClientDashboard(
  input: ClientDashboardQueryRequest,
  runtime: DashboardHttpDependencies = createConfiguredDashboardRuntime(),
): Promise<ClientDashboardQueryResult> {
  return runtime.query(input);
}
