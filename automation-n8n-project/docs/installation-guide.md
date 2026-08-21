# Installation Guide

1) Copy the project files from `outputs/automation-n8n-project`.

2) Set environment variables:
- `SGS_WEBHOOK_BASE_URL`
- `SGS_INTERNAL_WEBHOOK_BASE_URL`
- `SGS_QWEN_CLASSIFIER_URL`, `SGS_QWEN_RESPONSE_URL`
- `SGS_QWEN_*_MODEL`
- API URLs for session, calendar, CRM, KB and log endpoints.

3) In n8n import workflows in this order:
- `workflows/SGS-03-Knowledge-Search.json`
- `workflows/SGS-04-Service-Catalog.json`
- `workflows/SGS-05-Appointment-Manager.json`
- `workflows/SGS-06-Lead-Manager.json`
- `workflows/SGS-07-Human-Handoff.json`
- `workflows/SGS-08-Conversation-Logger.json`
- `workflows/SGS-02-AI-Orchestrator.json`
- `workflows/SGS-01-Chat-Gateway.json`

4) Activate in order:
- Subworkflows first, then main flow.

5) Configure `This workflow can be called by` on:
- `SGS-01` -> allow calls from external channels.
- `SGS-02` if using internal webhook calls from `SGS-01`.
- `SGS-03` to `SGS-08` if they will be called by `SGS-02`.

6) Test quick endpoints:
- `POST /webhook/sgs/chat`
- `POST /webhook/sgs-ai-orchestrator`

7) Start with `SERVICE_INFORMATION` and `BOOK_APPOINTMENT` manual payload tests.

