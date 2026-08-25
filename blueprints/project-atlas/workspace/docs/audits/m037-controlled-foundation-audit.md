# M037 Controlled Foundation Audit

## Review scope

Marketplace catalog, provider lifecycle, content and source governance, consent, journeys, referrals, redirects, conversion, commission, client projection, schema, authored migration, and focused tests.

## Controls

| Risk | Implemented control |
| --- | --- |
| A third-party offer could appear as a SG Solutions service or approval. | Listings, provider profiles, disclosure content, and potential-fit terminology retain the provider decision boundary. |
| A stale source could remain actionable. | Published listing versions require current reviewed source snapshots and availability is recalculated. |
| A partner could be activated or sent client data by configuration alone. | Provider creation forbids enabled status; all sharing and submission paths fail closed. |
| Referrals could duplicate during retry or unknown partner status. | Deterministic journey idempotency keys and unique provider conversion event references reject duplicates. |
| Personalization could use sensitive data or occur without consent. | Consent is scoped and active; matching rejects protected or sensitive factors. |
| Revenue could be recognized from an impression or unverified outcome. | Commission candidates require a verified provider conversion, contract reference, and calculation-rule version. |
| A partner could access another provider's referral. | Partner action checks the exact provider identity on the journey. |

## Residual decisions

- NEEDS PRODUCT OWNER DECISION: which partners, categories, disclosures, compensation relationships, and referral models may be activated.
- NEEDS PRODUCT OWNER DECISION: exact retention, privacy, and consent language for each provider and data category.
- NEEDS PRODUCT OWNER DECISION: finance policy for earned, paid, reversed, disputed, and taxable partner commission treatment.
- NEEDS PRODUCT OWNER DECISION: public Marketplace launch scope and provider-review ownership.
- NEEDS PRODUCT OWNER DECISION: partner authentication, service-account scopes, credential storage, webhook verification, and incident-response ownership.

## Conclusion

M037 is a controlled marketplace foundation only. It is not a live financial marketplace, referral engine, lead-submission system, provider portal, credit-monitoring integration, lender application flow, or revenue-recognition system.
