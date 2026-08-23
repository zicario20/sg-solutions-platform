# M011 Document Portal Runbook

## Current operating state

M011 is implemented in provider-disabled mode. The client portal gives safe guidance and reports
unavailability rather than accepting files when MinIO/S3, ClamAV and the durable runtime are not
configured. No production document may be treated as received until the activation checks below are
completed and approved.

## Activation prerequisites

1. Provision private, non-listable quarantine and accepted storage boundaries with opaque keys.
2. Configure `M011_MINIO_ENDPOINT`, `M011_MINIO_BUCKET`, access credentials and `M011_CLAMAV_ENDPOINT`
   only through the approved secret manager.
3. Apply the Drizzle migration from a verified backup and verify server-only RLS under the document
   gateway role. No client role may list, read or write objects directly.
4. Verify ClamAV with clean, EICAR, timeout and unavailable cases. Only `clean` may promote.
5. Verify upload byte limit, PDF/JPEG/PNG content signatures, MIME spoofing, single-use intents,
   revoked access and five-minute signed delivery against the real provider.
6. Obtain Product Owner approval before setting `M011_DOCUMENTS_ENABLED=true`.

## Recovery rules

- Scanner failure, timeout, missing metadata or promotion uncertainty: retain quarantine, deny
  delivery and create an internal recovery task; never override to clean.
- Malicious or unsupported content: deny delivery, preserve only bounded forensic metadata, and
  request a new upload through the portal.
- Legal hold: deny soft delete and escalate to the authorized compliance owner.
- No automatic physical purge is permitted until a legal retention schedule and purge authority are
  approved by the Product Owner.

## Prohibited operations

- Do not expose MinIO, buckets, object keys, permanent URLs, ClamAV or internal admin endpoints.
- Do not upload documents through email, chat or WhatsApp as authoritative storage.
- Do not use scan results as business acceptance, request satisfaction or authorization.
- Do not place document bytes, filenames, scanner output or signed URLs in logs or analytics.
