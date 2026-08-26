import type { ClientServiceRootProjection, ClientServicesSourcePort } from "@atlas/client-services";
import type { DashboardAuthorizationSnapshot } from "@atlas/dashboard";

export interface ClientServicesSqlTransaction {
  query<T extends Record<string, unknown>>(
    text: string,
    values: readonly unknown[],
  ): Promise<readonly T[]>;
}
export interface ClientServicesSqlPort {
  transaction<T>(work: (tx: ClientServicesSqlTransaction) => Promise<T>): Promise<T>;
}

type Row = Record<string, unknown>;
const text = (row: Row, name: string) => {
  if (typeof row[name] !== "string" || !row[name]) throw new TypeError(`Invalid ${name}`);
  return row[name] as string;
};
const integer = (row: Row, name: string) => {
  const value = Number(row[name]);
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`Invalid ${name}`);
  return value;
};
const object = (row: Row, name: string) => {
  if (!row[name] || typeof row[name] !== "object" || Array.isArray(row[name]))
    throw new TypeError(`Invalid ${name}`);
  return row[name] as Record<string, unknown>;
};
const array = (row: Row, name: string) => {
  if (!Array.isArray(row[name])) throw new TypeError(`Invalid ${name}`);
  return row[name] as readonly Record<string, unknown>[];
};

function root(row: Row): ClientServiceRootProjection {
  const display = (
    copy: Record<string, unknown>,
    milestones: readonly Record<string, unknown>[],
  ) => ({
    contextLabel: String(copy.contextLabel),
    serviceName: String(copy.serviceName),
    categoryLabel: String(copy.categoryLabel),
    scopeLabel: String(copy.scopeLabel),
    publicStateLabels: copy.publicStateLabels as Record<string, string>,
    axisLabels: copy.axisLabels as ClientServiceRootProjection["displays"]["en"]["axisLabels"],
    ...(copy.nextStepLabel ? { nextStepLabel: String(copy.nextStepLabel) } : {}),
    milestones:
      milestones as unknown as ClientServiceRootProjection["displays"]["en"]["milestones"],
  });
  return {
    serviceOrderId: text(row, "service_order_id"),
    ownerAccountId: text(row, "owner_account_id"),
    ownerContextOpaqueRef: text(row, "owner_context_ref"),
    resourceEpoch: integer(row, "resource_epoch"),
    acceptedDefinitionVersionId: text(row, "definition_version_id"),
    acceptedDefinitionEpoch: integer(row, "definition_epoch"),
    opaqueRef: text(row, "opaque_ref"),
    publicReference: text(row, "public_reference"),
    contextType: text(row, "context_type") as ClientServiceRootProjection["contextType"],
    axes: {
      commercial: text(
        row,
        "commercial_state",
      ) as ClientServiceRootProjection["axes"]["commercial"],
      financial: text(row, "financial_state") as ClientServiceRootProjection["axes"]["financial"],
      activation: text(
        row,
        "activation_state",
      ) as ClientServiceRootProjection["axes"]["activation"],
      fulfillment: text(
        row,
        "fulfillment_state",
      ) as ClientServiceRootProjection["axes"]["fulfillment"],
    },
    ownerFacts: {
      financial: {
        sourceVersion: text(row, "financial_source_version"),
        resourceEpoch: integer(row, "financial_resource_epoch"),
      },
      activation: {
        sourceVersion: text(row, "activation_source_version"),
        resourceEpoch: integer(row, "activation_resource_epoch"),
      },
      fulfillment: {
        sourceVersion: text(row, "fulfillment_source_version"),
        resourceEpoch: integer(row, "fulfillment_resource_epoch"),
      },
    },
    displays: {
      es: display(object(row, "display_es"), array(row, "milestones_es")),
      en: display(object(row, "display_en"), array(row, "milestones_en")),
    },
    ...(row.current_milestone_index === null
      ? {}
      : { currentMilestoneIndex: integer(row, "current_milestone_index") }),
    completedMilestones: integer(row, "completed_milestones"),
    criticalSources: {
      tasks: text(
        row,
        "tasks_source_status",
      ) as ClientServiceRootProjection["criticalSources"]["tasks"],
      documents: text(
        row,
        "documents_source_status",
      ) as ClientServiceRootProjection["criticalSources"]["documents"],
      payments: text(
        row,
        "payments_source_status",
      ) as ClientServiceRootProjection["criticalSources"]["payments"],
    },
    updatedAt: new Date(text(row, "updated_at")),
    grant: {
      permission: "client.service.read",
      state: text(row, "grant_state") as ClientServiceRootProjection["grant"]["state"],
      accountId: text(row, "grant_account_id"),
      contextOpaqueRef: text(row, "grant_context_ref"),
      authorizationEpoch: integer(row, "grant_authorization_epoch"),
      policyEpoch: integer(row, "grant_policy_epoch"),
      resourceEpoch: integer(row, "grant_resource_epoch"),
      ...(row.grant_expires_at ? { expiresAt: text(row, "grant_expires_at") } : {}),
    },
  };
}

const SELECT = `SELECT
  p.id AS service_order_id,
  p.account_id AS owner_account_id,
  p.context_opaque_ref AS owner_context_ref,
  p.resource_epoch,
  p.accepted_definition_version_id AS definition_version_id,
  d.definition_epoch,
  m.opaque_ref,
  p.public_reference,
  p.context_type,
  p.commercial_state,
  f.financial_state,
  f.source_version AS financial_source_version,
  f.resource_epoch AS financial_resource_epoch,
  a.activation_state,
  a.source_version AS activation_source_version,
  a.resource_epoch AS activation_resource_epoch,
  u.fulfillment_state,
  u.source_version AS fulfillment_source_version,
  u.resource_epoch AS fulfillment_resource_epoch,
  u.current_milestone_index,
  u.completed_milestones,
  p.updated_at,
  d.public_display_es AS display_es,
  d.public_display_en AS display_en,
  d.public_milestones_es AS milestones_es,
  d.public_milestones_en AS milestones_en,
  m.tasks_source_status,
  m.documents_source_status,
  m.payments_source_status,
  g.grant_state,
  g.account_id AS grant_account_id,
  g.context_opaque_ref AS grant_context_ref,
  g.authorization_epoch AS grant_authorization_epoch,
  g.policy_epoch AS grant_policy_epoch,
  g.resource_epoch AS grant_resource_epoch,
  g.expires_at AS grant_expires_at
FROM public.service_orders p
JOIN public.service_definition_versions d ON d.id = p.accepted_definition_version_id
JOIN public.service_order_financial_facts f ON f.service_order_id = p.id
JOIN public.service_order_activation_facts a ON a.service_order_id = p.id
JOIN public.service_order_fulfillment_facts u ON u.service_order_id = p.id
JOIN public.client_service_read_models m ON m.service_order_id = p.id
JOIN public.client_service_access_grants g
  ON g.service_order_id = p.id
  AND p.account_id = g.account_id
  AND p.context_opaque_ref = g.context_opaque_ref
WHERE p.tombstoned_at IS NULL
  AND g.permission = 'client.service.read'
  AND g.grant_state = 'active'
  AND g.account_id = $1
  AND g.context_opaque_ref = $2
  AND (g.expires_at IS NULL OR g.expires_at > transaction_timestamp())
  AND g.authorization_epoch = $3
  AND g.policy_epoch = $4
  AND g.resource_epoch = p.resource_epoch
  AND m.definition_epoch = d.definition_epoch
  AND m.financial_source_version = f.source_version
  AND m.activation_source_version = a.source_version
  AND m.fulfillment_source_version = u.source_version`;

const PUBLIC_STATE_SQL = `CASE
  WHEN m.tasks_source_status = 'unavailable' OR m.documents_source_status = 'unavailable' OR m.payments_source_status = 'unavailable' THEN 'unconfirmed'
  WHEN f.financial_state = 'unavailable' OR a.activation_state = 'unavailable' OR u.fulfillment_state = 'unavailable' THEN 'unconfirmed'
  WHEN p.commercial_state = 'preliminary' AND u.fulfillment_state <> 'not_started' THEN 'unconfirmed'
  WHEN p.commercial_state = 'cancelled' THEN CASE
    WHEN u.fulfillment_state NOT IN ('not_started', 'cancelled') THEN 'unconfirmed'
    WHEN f.financial_state = 'refunded' THEN 'refunded'
    ELSE 'cancelled'
  END
  WHEN u.fulfillment_state IN ('in_progress', 'waiting_client', 'waiting_external', 'completed') AND a.activation_state NOT IN ('approved', 'not_required') THEN 'unconfirmed'
  WHEN f.financial_state = 'disputed' THEN 'disputed'
  WHEN f.financial_state = 'refunded' THEN 'refunded'
  WHEN f.financial_state = 'partially_refunded' THEN 'partially_refunded'
  WHEN u.fulfillment_state = 'completed' THEN 'completed'
  WHEN u.fulfillment_state = 'waiting_client' THEN 'waiting_client'
  WHEN u.fulfillment_state = 'waiting_external' THEN 'waiting_external'
  WHEN u.fulfillment_state = 'in_progress' THEN 'in_progress'
  WHEN a.activation_state = 'pending_review' THEN 'pending_review'
  WHEN a.activation_state IN ('approved', 'not_required') THEN CASE
    WHEN f.financial_state IN ('unpaid', 'processing') THEN 'payment_pending'
    WHEN f.financial_state = 'paid' AND p.commercial_state = 'active' AND u.fulfillment_state = 'not_started' THEN 'approved_to_start'
    ELSE 'unconfirmed'
  END
  WHEN p.commercial_state = 'preliminary' THEN 'preliminary'
  ELSE 'unconfirmed'
END`;

async function scoped<T>(
  sql: ClientServicesSqlPort,
  snapshot: DashboardAuthorizationSnapshot,
  work: (tx: ClientServicesSqlTransaction) => Promise<T>,
) {
  return sql.transaction(async (tx) => {
    await tx.query("SET LOCAL ROLE atlas_client_services_reader", []);
    await tx.query(
      "SELECT set_config('atlas.account_id',$1,true),set_config('atlas.context_opaque_ref',$2,true),set_config('atlas.authorization_epoch',$3,true),set_config('atlas.policy_epoch',$4,true)",
      [
        snapshot.accountId,
        snapshot.context.opaqueRef,
        String(snapshot.authorizationEpoch),
        String(snapshot.policyEpoch),
      ],
    );
    return work(tx);
  });
}

function emptyContext(snapshot: DashboardAuthorizationSnapshot) {
  const type =
    snapshot.context.type === "organization" ? ("organization" as const) : ("personal" as const);
  const selected = snapshot.contextOptions.find(
    (option) => option.opaqueRef === snapshot.context.opaqueRef,
  );
  const fallback =
    snapshot.locale === "es"
      ? type === "organization"
        ? "Organización"
        : "Personal"
      : type === "organization"
        ? "Organization"
        : "Personal";
  return { type, label: selected?.label ?? fallback };
}

export function createPostgresClientServicesSource(
  sql: ClientServicesSqlPort,
): ClientServicesSourcePort {
  return {
    async list({ snapshot, query, status, limit }) {
      return scoped(sql, snapshot, async (tx) => {
        const rows = await tx.query<Row>(
          `${SELECT}
          AND ($5::text IS NULL OR p.public_reference ILIKE '%'||$5||'%' OR d.public_display_es->>'serviceName' ILIKE '%'||$5||'%' OR d.public_display_en->>'serviceName' ILIKE '%'||$5||'%')
          AND ($6::text IS NULL OR (${PUBLIC_STATE_SQL}) = $6)
          ORDER BY p.updated_at DESC, p.id LIMIT $7`,
          [
            snapshot.accountId,
            snapshot.context.opaqueRef,
            snapshot.authorizationEpoch,
            snapshot.policyEpoch,
            query ?? null,
            status ?? null,
            limit,
          ],
        );
        return rows.length
          ? { state: "fresh", generatedAt: new Date(), items: rows.map(root) }
          : { state: "empty", generatedAt: new Date(), context: emptyContext(snapshot) };
      });
    },
    async detail({ snapshot, opaqueRef }) {
      return scoped(sql, snapshot, async (tx) => {
        const rows = await tx.query<Row>(`${SELECT} AND m.opaque_ref = $5 LIMIT 1`, [
          snapshot.accountId,
          snapshot.context.opaqueRef,
          snapshot.authorizationEpoch,
          snapshot.policyEpoch,
          opaqueRef,
        ]);
        return rows[0]
          ? { state: "fresh", generatedAt: new Date(), root: root(rows[0]) }
          : { state: "not_found" };
      });
    },
    async verifyFinalFence({ snapshot, fence }) {
      return scoped(sql, snapshot, async (tx) => {
        const rows = await tx.query<Row>(
          `SELECT p.id
          FROM public.service_orders p
          JOIN public.service_definition_versions d ON d.id = p.accepted_definition_version_id
          JOIN public.service_order_financial_facts f ON f.service_order_id = p.id
          JOIN public.service_order_activation_facts a ON a.service_order_id = p.id
          JOIN public.service_order_fulfillment_facts u ON u.service_order_id = p.id
          JOIN public.client_service_read_models m ON m.service_order_id = p.id
          JOIN public.client_service_access_grants g ON g.service_order_id = p.id AND p.account_id = g.account_id AND p.context_opaque_ref = g.context_opaque_ref
          WHERE p.id = $5
            AND p.account_id = $1
            AND p.context_opaque_ref = $2
            AND p.resource_epoch = $6
            AND p.accepted_definition_version_id = $7
            AND d.definition_epoch = $8
            AND p.tombstoned_at IS NULL
            AND g.grant_state = 'active'
            AND g.authorization_epoch = $3
            AND g.policy_epoch = $4
            AND g.resource_epoch = $9
            AND (g.expires_at IS NULL OR g.expires_at > transaction_timestamp())
            AND f.source_version = $10 AND f.resource_epoch = $11 AND m.financial_source_version = f.source_version
            AND a.source_version = $12 AND a.resource_epoch = $13 AND m.activation_source_version = a.source_version
            AND u.source_version = $14 AND u.resource_epoch = $15 AND m.fulfillment_source_version = u.source_version
            AND NOT EXISTS (
              SELECT 1 FROM jsonb_to_recordset($16::jsonb) AS expected("internalResourceId" text, "resourceEpoch" bigint, "sourceVersion" text)
              WHERE NOT EXISTS (
                SELECT 1 FROM public.client_service_child_resource_fences c
                WHERE c.service_order_id = p.id
                  AND c.internal_resource_id = expected."internalResourceId"
                  AND c.resource_epoch = expected."resourceEpoch"
                  AND c.source_version = expected."sourceVersion"
              )
            )`,
          [
            snapshot.accountId,
            snapshot.context.opaqueRef,
            snapshot.authorizationEpoch,
            snapshot.policyEpoch,
            fence.serviceOrderId,
            fence.rootEpoch,
            fence.definitionVersionId,
            fence.definitionEpoch,
            fence.grantResourceEpoch,
            fence.ownerFacts.financial.sourceVersion,
            fence.ownerFacts.financial.resourceEpoch,
            fence.ownerFacts.activation.sourceVersion,
            fence.ownerFacts.activation.resourceEpoch,
            fence.ownerFacts.fulfillment.sourceVersion,
            fence.ownerFacts.fulfillment.resourceEpoch,
            JSON.stringify(fence.childResources),
          ],
        );
        return rows.length === 1;
      });
    },
  };
}
