# Phase Plan (as requested)

1. Inspect:
   - validate n8n and existing Qwen integration
   - list credentials, current webhooks, existing workflows
2. Architecture:
   - define contracts and routing table
3. Core Chat:
   - implement gateway + orchestrator + response generation
4. Knowledge:
   - implement `SGS-03` and `SGS-04` as replaceable modules
5. Scheduling:
   - implement `SGS-05` with check/booking/reschedule/cancel flow
6. CRM / Leads:
   - implement `SGS-06` and session handoff state
7. Human Handoff:
   - implement `SGS-07` with escalation reasons and priority
8. Logging & Reliability:
   - implement `SGS-08` and tool failure branches
9. Testing:
   - execute test cases
10. Documentation:
   - finalize READMEs and runbooks
