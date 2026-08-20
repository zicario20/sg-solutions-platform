import { afterAll } from "vitest";
import {
  assertRestrictedCommunicationsPrincipal,
  COMMUNICATIONS_TRANSACTION_SQL,
  createCommunicationsSql,
  createPostgresCommunicationsRepository,
} from "../../packages/database/src/index.ts";
import {
  communicationsConformanceIds,
  communicationsConformanceSeed,
  runCommunicationsRepositoryConformance,
} from "../support/communications-repository-conformance.ts";
import { createVerifiedProviderStatusReceiptAuthority } from "@atlas/domain";

const integrationUrl = process.env.M004_POSTGRES_INTEGRATION_URL;
const sql = integrationUrl ? createCommunicationsSql(integrationUrl) : null;

afterAll(async () => {
  if (sql) await sql.end({ timeout: 5 });
});

async function seedScenario(scenario: string): Promise<void> {
  if (!sql) throw new Error("M004_POSTGRES_INTEGRATION_URL_REQUIRED");
  const ids = communicationsConformanceIds(scenario);
  const seed = communicationsConformanceSeed(scenario);
  const primaryBinding = seed.bindings![0]!;
  const template = seed.templates![0]!;
  await sql.begin(async (tx) => {
    const principalRows = await tx.unsafe<
      Array<Parameters<typeof assertRestrictedCommunicationsPrincipal>[0]>
    >(COMMUNICATIONS_TRANSACTION_SQL.attestPrincipal);
    assertRestrictedCommunicationsPrincipal(principalRows[0]);
    await tx.unsafe(COMMUNICATIONS_TRANSACTION_SQL.setLocalRole);
    await tx`
      insert into communication_channel_connections (
        id, channel_kind, adapter_key, readiness_state, policy_version, version,
        configured_at, verified_at, suspended_at, created_at, updated_at
      ) values (
        ${ids.connectionId}, 'whatsapp', 'meta_cloud', 'active', 'synthetic.v1', 1,
        ${primaryBinding.createdAt}, ${primaryBinding.createdAt}, null,
        ${primaryBinding.createdAt}, ${primaryBinding.updatedAt}
      ) on conflict (id) do nothing
    `;
    for (const [index, binding] of seed.bindings!.entries()) {
      const policy = seed.policies![index]!;
      const consents = seed.consents!.filter((consent) => consent.bindingId === binding.bindingId);
    await tx`
      insert into communication_contact_bindings (
        id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
        trust_state, locale, contact_policy_version, version, verification_receipt_id,
        endpoint_verified_at, verification_expires_at, wrong_person_reported_at,
        reassignment_risk_at, suspended_at, created_at, updated_at
      ) values (
        ${binding.bindingId}, ${ids.connectionId}, 'whatsapp', ${"b".repeat(64)},
        'endpoint.v1', ${binding.trustState}, 'en', ${policy.version}, 1,
        ${`verification_${ids.bindingId}`}, ${binding.createdAt}, ${binding.freshUntil},
        null, null, null, ${binding.createdAt}, ${binding.updatedAt}
      ) on conflict (id) do nothing
    `;
      for (const [consentIndex, consent] of consents.entries()) {
        await tx`
          insert into communication_contact_policies (
            id, binding_id, purpose, consent_state, fence_state, decision_code,
            evidence_receipt_id, version, fence, evaluated_at, created_at, updated_at
          ) values (
            ${`${policy.policyId}_${consent.purpose}`}, ${binding.bindingId}, ${consent.purpose},
            ${consent.state}, ${policy.state}, 'allowed', ${consent.receipt!.receiptId},
            ${policy.version}, ${policy.fence}, ${policy.updatedAt}, ${binding.createdAt},
            ${policy.updatedAt}
          ) on conflict (binding_id, purpose) do nothing
        `;
        await tx`
          insert into communication_contact_evidence_events (
            id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
            binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
            owning_domain, authority_role, authority_version, triggering_event_id,
            policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
            occurred_at, created_at
          ) values (
            ${`evidence_${ids.bindingId}_${consent.purpose}`}, ${binding.bindingId},
            ${consentIndex + 1}, 'consent_granted', ${consent.purpose}, 'granted', 'normal',
            null, null, ${consent.receipt!.receiptId}, 'consent_evidence', 'M078',
            'consent', ${consent.version}, null, null,
            ${`consent_correlation_${ids.bindingId}_${consent.purpose}`},
            ${consent.receipt!.issuedAt}, ${consent.receipt!.expiresAt},
            ${consent.changedAt}, ${consent.changedAt}
          ) on conflict (evidence_receipt_id) do nothing
        `;
      }
    }
    await tx`
      insert into communication_message_templates (
        id, template_key, locale, purpose, definition_source, definition_version,
        variable_keys, state, internally_approved, approval_receipt_id,
        approval_receipt_issued_at, approval_receipt_valid_until, external_reference,
        projection_version, provider_receipt_id, provider_correlation_id,
        provider_receipt_issued_at, provider_receipt_valid_until, category,
        observed_at, created_at, updated_at
      ) values (
        ${template.templateId}, ${template.templateId}, ${template.locale}, 'transactional',
        'synthetic_test_fixture', ${template.definitionVersion}, '[]'::jsonb,
        ${template.providerState}, true, ${`approval_${template.templateId}`},
        ${template.updatedAt}, ${primaryBinding.freshUntil}, ${`provider_${template.templateId}`},
        ${template.providerVersion}, ${`provider_receipt_${template.templateId}`},
        ${`provider_correlation_${template.templateId}`}, ${template.updatedAt},
        ${primaryBinding.freshUntil}, 'utility', ${template.updatedAt}, ${template.updatedAt},
        ${template.updatedAt}
      ) on conflict (template_key, locale) do nothing
    `;
  });
}

runCommunicationsRepositoryConformance(
  "postgres",
  async (scenario) => {
    if (!sql) throw new Error("M004_POSTGRES_INTEGRATION_URL_REQUIRED");
    await seedScenario(scenario);
    const providerStatusAuthority = createVerifiedProviderStatusReceiptAuthority();
    const repository = createPostgresCommunicationsRepository(sql, {
      providerStatusReceiptResolver: providerStatusAuthority.resolver,
    });
    return {
      repository,
      providerStatusReceiptIssuer: providerStatusAuthority.issuer,
      inspectState: () => repository.referenceState(),
    };
  },
  Boolean(integrationUrl),
);
