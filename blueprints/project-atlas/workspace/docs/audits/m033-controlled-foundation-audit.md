# M033 Controlled Foundation Audit

Date: 2026-08-25

## Findings corrected during implementation

1. M033 could not reuse M032 safely without an explicit formation-case reference and an
   organization identity snapshot. The controlled contracts now use both references and hash the
   snapshot; they do not copy organization records.
2. A direct EIN value would violate the data-protection boundary. The issuance model permits only
   a `fullEinSecureRef`; client projections and handoffs explicitly expose no full EIN.
3. Automatic submission would create duplicate-application and provider-risk exposure. The
   workflow requires verified responsible party, current requirement snapshot, client authorization
   bound to the application hash, operational approval, and an enabled provider. Default provider
   states fail closed.
4. Unknown external outcomes must not be retried blindly. Submission preparation blocks when an
   immutable unknown-outcome attempt exists.
5. A separate document store would duplicate M011 controls. M033 indexes existing document refs
   and immutable hashes instead.

## Residual activation risks

The code is a provider-disabled foundation. It is not an IRS integration, does not validate current
IRS procedures at runtime, and cannot be represented as an operational EIN service until the
activation prerequisites in `docs/modules/m033-ein-business-documents.md` are approved and tested.
