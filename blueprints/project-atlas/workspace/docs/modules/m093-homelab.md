# M093 - Homelab

## Status

Controlled foundation implemented. No node enrollment, network/storage provisioning, remote access, container runtime, power control, thermal control or hardware discovery is active. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/homelab` defines safe site, topology, hardware-profile, node, network-zone, remote-access, provisioning-request and readiness contracts.
- Node classes distinguish management, lightweight AI, GPU AI, storage, voice, worker, utility and development roles without granting workload access or application authorization.
- Network zones are purpose-oriented, require a default-deny posture and reject flat-trust modeling.
- Hardware and network records use safe references; raw serial numbers, addresses, secrets and credentials are not stored.
- Remote access remains inactive, requires identity/MFA when later enabled and never becomes application authorization.

## Boundaries

- M093 owns only infrastructure metadata and lifecycle preparation; it does not own AI models, prompts, RAG, deployments, business workflows, backups or user authorization.
- M094 owns lightweight inference, M095 owns GPU workload behavior, M097 owns observability, M098 backup/recovery and M099 deployments.
- A reachable node, internal DNS name, certificate or VM/container substrate never implies trust or permission.

## Persistence preparation

`packages/database/src/schema/homelab.ts` prepares non-secret lifecycle metadata for sites, topology, hardware profiles, nodes, zones, remote-access profiles and provisioning requests. It stores no operational connection data or control-plane commands.

## Future activation prerequisites

1. Product Owner approves the physical topology, site, segmentation and operations plan.
2. Network, storage, remote-access, patching, power, thermal and recovery runbooks are reviewed.
3. M080/M081/M083/M084 controls, M077 audit and M097/M098/M099 integration evidence are validated.

## Test coverage added

`tests/m093/homelab.test.ts` captures segmentation, no-public-management and disabled provisioning/readiness behavior. The test file was added but not executed in this change.
