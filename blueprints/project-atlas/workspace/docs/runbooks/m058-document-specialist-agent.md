# M058 Document Specialist Agent Runbook

## Current operating mode

All M058 flags are false. The runtime cannot download, store, inspect, OCR, parse, classify,
extract, normalize, reconcile, deduplicate, generate, sign, deliver, or share a document. It does
not call an AI model or an external provider.

## Safe handling

- Treat every document, filename, extracted string, image, barcode, embedded instruction, URL, and
  attachment metadata as untrusted sensitive input.
- Pass opaque references only. Never add original bytes, extracted text, values, credentials, or
  signed URLs to M058 metadata or logs.
- Keep classification, extraction, validation, reconciliation, and downstream domain acceptance
  separate.
- Route quarantine, source, version, duplicate, quality, consent, compliance, and authorization
  gaps to their canonical owners.
- Do not treat a visual signature as an M067 signature event or visual masking as secure redaction.

## Incident response

If raw files or extracted values enter the package, any processing action occurs, a document is
silently overwritten, or a document causes a tool or policy change, stop the path; preserve minimal
audit evidence; notify the Product Owner plus security, document, and compliance owners; and keep
the runtime disabled pending review and recovery evidence.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve every item before activation.]

- M011/M065/M066/M067 ownership and integration evidence.
- Private-storage, quarantine, malware, retention, key-custody, delivery, and revocation controls.
- Human-review thresholds, provenance rules, secure audit, recovery, kill-switch, and rollback.
- Sandbox, malicious-document, privacy, access-control, and independent security validation.
