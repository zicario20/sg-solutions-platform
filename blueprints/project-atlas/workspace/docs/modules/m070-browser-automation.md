# M070 - Browser Automation

- Status: controlled foundation implemented; provider disabled.
- Operational activation: pending Product Owner approval, portal-specific authorization, security review, and controlled worker deployment.

## Scope implemented

M070 provides typed contracts and persistence for isolated worker profiles, browser profiles, network policies, sessions, navigation requests, action contracts, action plans, and untrusted evidence records. HTTPS origin allowlists are represented but no connection is made.

## Authority boundaries

- M068 authorizes workflow stages and M071 supplies jurisdiction applicability candidates.
- A browser page, DOM value, populated field, click, or confirmation screen is not a canonical business outcome.
- Browser evidence is untrusted until an approved domain process verifies it.
- The module cannot independently authorize a filing, payment, refund, signature, dispute, application, account change, or other external side effect.

## Disabled capabilities

No worker runtime, browser binary, session launch, navigation, cookie persistence, credential injection, file transfer, screenshot capture, human takeover, CAPTCHA bypass, MFA bypass, portal action, or external submission is active.

## Activation prerequisites

1. Define a portal-specific approved use case and M068 workflow gate.
2. Approve a M071 source-grounded jurisdiction and portal binding where applicable.
3. Deploy isolated workers with network allowlists, secrets controls, storage isolation, monitoring, and kill switches.
4. Define action evidence, idempotency, human approval, reconciliation, and failure recovery.
5. Complete legal, security, operational, and Product Owner review before activation.
