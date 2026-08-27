# M061 - Skills System

## Status

Controlled, provider-disabled foundation implemented. This is product-agent runtime governance, not
the repository developer-skill folders.

## Architecture and boundary

The foundation models stable skill definitions, draft versions, explicit bindings, dependency
checks, authority intersections, and non-dispatching invocation decisions. Effective authority is
the intersection of actor scope, agent manifest, skill manifest, tool policy, resource policy,
consent, entitlement, approval, and environment. A skill never adds authority.

## Fail-closed controls

No skill is enabled. No model, tool, job, workflow, external write, personalized cache, fallback,
or canonical write is enabled. Direct circular dependencies are rejected.

## Enablement

Bind an immutable reviewed skill to an M047 manifest; enforce IAM, output validation, audit,
consent, entitlement, approval, and scoped context; test failure paths; obtain Product Owner
authorization for a limited rollout.
