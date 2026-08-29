import { describe, expect, it } from "vitest";

import {
  createHardwareProfile,
  createHomelabNetworkZone,
  createHomelabNode,
  createHomelabRemoteAccessProfile,
  createHomelabSite,
  evaluateHomelabNodeReadiness,
  requestHomelabNodeProvisioning,
} from "../../packages/homelab/src/index";

describe("M093 homelab controlled foundation", () => {
  it("does not provision or mark a node ready", () => {
    const site = createHomelabSite({ permission: "homelab.site.create", siteCode: "PRIMARY_HOME", environment: "local" });
    const hardware = createHardwareProfile({ permission: "homelab.hardware.create", hardwareProfileCode: "SERVER_REFERENCE", capacityReference: "capacity:server-v1" });
    const node = createHomelabNode({ permission: "homelab.node.create", nodeCode: "gpu-local-01", site, nodeClass: "gpu_ai", hardwareProfile: hardware });
    const provisioning = requestHomelabNodeProvisioning({ permission: "homelab.provisioning.request", requestCode: "PROVISION_001", node });
    const readiness = evaluateHomelabNodeReadiness({ permission: "homelab.readiness.evaluate", node });

    expect(provisioning.provisioningExecuted).toBe(false);
    expect(readiness.status).toBe("review_required");
    expect(readiness.ready).toBe(false);
  });

  it("rejects a flat trust zone and public management exposure", () => {
    expect(() =>
      createHomelabNetworkZone({ permission: "homelab.network_zone.create", zoneCode: "FLAT", purpose: "everything", trustClass: "workload", treatsAllNodesAsSameTrust: true }),
    ).toThrow("one flat trust zone");

    const site = createHomelabSite({ permission: "homelab.site.create", siteCode: "SECONDARY_HOME", environment: "test" });
    expect(() =>
      createHomelabRemoteAccessProfile({ permission: "homelab.remote_access.create", profileCode: "UNSAFE_MANAGEMENT", site, exposesPublicManagement: true }),
    ).toThrow("cannot expose the management plane publicly");
  });

  it("keeps remote access separate from application authorization", () => {
    const site = createHomelabSite({ permission: "homelab.site.create", siteCode: "SAFE_HOME", environment: "development" });
    const profile = createHomelabRemoteAccessProfile({ permission: "homelab.remote_access.create", profileCode: "SAFE_REMOTE", site });

    expect(profile.remoteAccessGranted).toBe(false);
    expect(profile.applicationAuthorizationGranted).toBe(false);
    expect(profile.identityMfaRequired).toBe(true);
  });
});
