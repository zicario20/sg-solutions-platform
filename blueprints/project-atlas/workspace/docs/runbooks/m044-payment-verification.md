# M044 Payment Verification Runbook

## Current state

M044 is a controlled, provider-disabled foundation. No staff procedure in this document authorizes a
payment verification, provider call, entitlement change, service start, migration or deployment.

## Future activation checklist

1. Approve the payment-verification policy and role matrix.
2. Verify M042/M046 obligation and pricing snapshots are canonical and versioned.
3. Verify M043 signed event admission and approved provider retrieval are available in sandbox.
4. Review migration 0054, backup evidence, RLS policies, gateway role and restore plan.
5. Configure M024/M074 review paths for manual evidence, overrides, refunds and disputes.
6. Configure M077 audit retention, M078 consent dependencies and M083 secret references.
7. Run sandbox reconciliation, duplicate delivery, out-of-order event, stale evidence, refund,
   dispute, reversal, partial-payment, overpayment and outage-recovery scenarios.
8. Obtain independent finance/security review and Product Owner rollout approval.

## Manual-review procedure after authorization

- Open a case only through the authorized M044 queue.
- Confirm actor purpose, client/obligation relationship, provider environment and policy version.
- Review reference-only evidence. Do not copy raw provider payloads, secrets or card data into notes.
- Do not treat a receipt, browser return, client assertion or amount match as proof by itself.
- For external/manual evidence, collect the required approval and second review before a new
  decision is created.
- Refunds, disputes and reversals require re-verification. Do not edit a historic decision.
- Escalate conflicting ownership, evidence tampering, environment mismatch or duplicated payment to
  security/finance review.

## Recovery and rollback

- If retrieval/reconciliation is unavailable, preserve the last decision and block new positive
  verification.
- Queue candidate processing with a stable idempotency key. Never replay by generating a new key.
- A failed job must enter a dead-letter record with failure code, attempt count and owner.
- Rolling back a policy or adapter does not delete decisions, gates, audit records or evidence
  hashes. Use a new superseding decision after the cause is understood.
- Restore testing must validate row counts, decision hashes, idempotency uniqueness, RLS, client
  isolation and non-dispatch of M045/M068 handoffs.

## Restricted information

Never record PAN, CVV, raw card/payment payloads, provider secrets, full bank details, signed URLs
or sensitive client documents in M044 logs, queue summaries, analytics or exports.
