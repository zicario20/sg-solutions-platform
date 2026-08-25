# M034 Controlled Foundation Audit

Date: 2026-08-25

## Architecture findings addressed

1. Compliance cannot be inferred permanently from a formation event. M034 uses source-backed,
   effective-dated, versioned requirements plus versioned organization snapshots.
2. A due date without a trace or confidence would create a false obligation. The deadline engine
   persists rule version, inputs, timezone, trace and confidence; unresolved inputs throw.
3. A legal obligation and a purchased service are distinct. Every obligation stores responsibility
   and service scope separately.
4. Client-entered change data cannot overwrite official data. Change requests are hashed and remain
   review-required until an official-document-backed update is created.
5. Provider execution and retries create unacceptable regulatory risk. Filing preparation requires
   an authorized package, explicit provider enablement and idempotency, while unknown outcomes block
   retries. All providers are disabled in this implementation.
6. Ownership-reporting and AI outputs are compliance-sensitive. The controlled model emits only
   professional-review outcomes and grounded, non-authoritative AI suggestions.

## Remaining activation risks

M034 is not operational until per-jurisdiction requirements are verified, approved and maintained;
calendar/task/notification and provider adapters are connected; high-risk filing actions receive
independent security/compliance review; and staging evidence proves reconciliation and recovery.
