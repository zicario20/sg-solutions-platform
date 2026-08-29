# M099 - Deployments

## Status

Technical controlled foundation implemented. Deployment runtime, provider connections and production
activation remain disabled. Product Owner acceptance is pending.

## Canonical responsibility

M099 models immutable artifact references, release candidates, environment promotion plans,
configuration and secret references, migration plans, rollout strategies, health-gate references,
rollback requests and deployment evidence. It is not source control, CI, infrastructure ownership,
business authorization, secret storage, observability truth or recovery truth.

## Implemented boundaries

- M090 remains configuration and feature-flag owner.
- M083 remains raw-secret and secret-lifecycle owner; M099 stores only references.
- M093 owns host, network, storage and target readiness.
- M094-M096 own AI, GPU and voice runtime semantics.
- M097 owns telemetry, health and alert evidence.
- M098 owns backup/recovery and recovery-readiness evidence.
- M099 consumes references from those owners and cannot change their authority.

## Implemented contracts

- Systems and isolated environment types: development, test, staging, production, sandbox,
  recovery and local.
- Artifact registrations with build/source/checksum references, never an implied verification.
- Configuration/secret bindings that reject raw credentials.
- Stateful migration plans with irreversible and roll-forward/expand-contract markers.
- Release candidates whose approval, deployment and health remain distinct states.
- Plans for all-at-once, rolling, canary, blue-green, shadow, feature-flag-assisted and
  manual-stage rollout strategies.
- Fail-closed deployment and rollback requests plus readiness/evidence contracts.

## Safety rules

Build success is not release approval. Artifact publication is not deployment. Deployment is not
service health or business outcome. Feature flags never replace authorization, entitlements or
Product Owner approval. No raw secret, private reasoning, target-side action, traffic shift,
migration, rollback or provider call occurs in this foundation.

## Activation gate

Activation requires Product Owner authorization, M090/M083 bindings, verified M093 targets,
artifact/provenance policy, M097 health evidence, M098 recovery evidence, migration review,
rollback rehearsal, change window and staging validation. No Dokploy, Cloudflare, Docker, DNS,
registry, CI/CD or production deployment is configured here.