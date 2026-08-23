# M012 secure messaging runbook

## Activation boundary

M012 remains disabled unless all of the following are deliberately configured in the server runtime:

```text
M012_SECURE_MESSAGING_ENABLED=true
DATABASE_URL=postgresql://...
M012_MESSAGE_ENCRYPTION_KEY=<32-byte base64url key>
AUTH_CANONICAL_ORIGIN=https://approved-origin
AUTH_SESSION_CSRF_SECRET=<existing M007 secret>
DASHBOARD_CONTEXT_HMAC_KEY=<existing M008 secret>
```

Never place these values in the repository, browser bundle, analytics, logs or ticket content. The
runtime fails closed with a private `503` response when any prerequisite is absent.

## Database preparation

Generate and review the Drizzle migration for `secure_message_conversations`,
`secure_message_entries`, `secure_message_document_references` and `secure_message_audit_events`.
Provision `atlas_secure_messaging_gateway` as a non-login gateway role and verify RLS before enabling
traffic. Run a migration backup and restore rehearsal first. Do not use Studio/dashboard changes as
schema authority.

## Operational limits

- The module stores message bodies as AES-256-GCM ciphertext.
- Browser payloads never provide an account, context, authorization epoch or policy epoch.
- Internal notes and audit records never enter client DTOs.
- Attachments are M011 opaque `doc1_` references only; no storage key, signed URL or document byte is
  carried by M012.
- External channels, delivery receipts, automation, AI, translation and notifications are disabled.

## Incident response

If the encryption key is suspected compromised, disable M012, preserve audit evidence, rotate the
key through an approved re-encryption plan and require a security review. Do not attempt to decrypt
or export message bodies from an ad-hoc console. Product Owner approval is required for retention,
export, deletion and legal-hold actions.
