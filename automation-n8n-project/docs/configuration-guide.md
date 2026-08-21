# Configuration Guide

## Core design choices

- N8N keeps action execution; Qwen only classifies and drafts responses.
- `SGS-01` should be your incoming channel gateway.
- `SGS-02` is the business brain and tool router.
- `SGS-03..08` are replaceable modules.

## Variables that must be set

- `SGS_WEBHOOK_BASE_URL`
- `SGS_INTERNAL_WEBHOOK_BASE_URL` (inside n8n use container-safe URL)
- `SGS_QWEN_CLASSIFIER_URL`, `SGS_QWEN_RESPONSE_URL`
- `SGS_QWEN_*_MODEL`
- `SGS_CALENDAR_API_URL`
- `SGS_SESSION_API_URL`
- `SGS_CRM_API_URL`
- `SGS_KB_API_URL` (optional, else static)
- `SGS_SERVICE_CATALOG_URL` (optional, else static)
- `SGS_LOGGING_API_URL`

## Placeholder replacements required

Replace all values beginning with `REPLACE_WITH_...`:
- `REPLACE_WITH_QWEN_CHAT_URL`
- `REPLACE_WITH_CALENDAR_BASE_URL`
- `REPLACE_WITH_CRM_API_URL`
- `REPLACE_WITH_HUMAN_INBOX_WEBHOOK`
- `REPLACE_WITH_LOGGING_API`

## Security & governance

1. Do not store API keys in the workflow.
2. Keep env variables in your n8n runtime configuration.
3. Mask tool output fields before logging.
4. Ensure channels with PII apply retention policies.
5. Add allow-lists for outbound URLs where possible.

## Sensitive actions policy

Set in orchestrator map:
- If action implies: legal filing, credit disputes submission, financing submission, official document submission, payment capture, account changes
- then route to `admin_approval_required` and then to `SGS-07 Human Handoff` instead of direct execution.

