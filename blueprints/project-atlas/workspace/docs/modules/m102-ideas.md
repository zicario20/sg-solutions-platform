# M102 - Ideas

## Status

Technical controlled foundation implemented. Intake connections, attachments, link fetches, semantic
dedupe, search, ranking, jobs, notifications, analytics, parking writes, promotion writes and
provider connections remain disabled. Product Owner acceptance is pending.

## Canonical responsibility

M102 is the governed capture and evaluation domain for ideas. It records an idea's problem and
opportunity framing, source type, assumptions, evidence references, candidate scorecard, triage,
pack and destination requests. It is not a roadmap, decisions log, research system, experiment
engine, backlog executor, notification service or automatic prioritization system.

## Implemented boundaries

- M100 owns technical sequencing; M102 can only request a reviewed destination reference.
- M101 owns business sequencing; M102 cannot change commercial priorities, pricing or offers.
- M103 owns preservation and revisit of parked items; M102 emits only a reviewed parking request.
- M104-M107 and M109 remain destination/reference boundaries, not active integrations.
- AI suggestions are merely an idea source; they cannot score, merge, park, promote or decide.

## Implemented contracts

- Version-one idea records with source, domain, scope, problem and opportunity references.
- Assumption and evidence contracts marked unvalidated/unverified by default.
- Candidate scorecards for strategic fit, customer value, business value, feasibility and risk;
  no ranking or decision is inferred from numeric input.
- Triage outcomes, domain packs and safe owner/safety-gate references.
- Parking and promotion requests that are review-required and cannot write a destination.
- Fail-closed readiness evaluation that preserves the difference between an idea and approved work.

## Safety rules

An idea is not an approved project, service, experiment, technical change, commercial action or
provider authorization. No customer information, raw attachment, credential, private reasoning,
search index, semantic similarity query, notification or destination write is performed here.

## Activation gate

Operational activation requires Product Owner authorization, M081 authorization, M077 audit,
M082/M085 privacy and retention controls, M089 search policy, M063/M064 evidence controls,
M072/M068 job/workflow controls, M074/M075 human review, M097 observability and a bounded rollout.