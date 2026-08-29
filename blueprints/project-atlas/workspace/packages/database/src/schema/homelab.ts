import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m093HomelabSites = pgTable("m093_homelab_sites", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  environment: text("environment").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  physicalSecurityReviewed: boolean("physical_security_reviewed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m093HomelabTopologies = pgTable("m093_homelab_topologies", {
  id: uuid("id").primaryKey(),
  siteId: uuid("site_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  controlPlaneConnected: boolean("control_plane_connected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m093HardwareProfiles = pgTable("m093_hardware_profiles", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  capacityReference: text("capacity_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  rawSerialStored: boolean("raw_serial_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m093HomelabNodes = pgTable("m093_homelab_nodes", {
  id: uuid("id").primaryKey(),
  siteId: uuid("site_id").notNull(),
  hardwareProfileId: uuid("hardware_profile_id").notNull(),
  code: text("code").notNull().unique(),
  nodeClass: text("node_class").notNull(),
  status: text("status").notNull(),
  enrolled: boolean("enrolled").notNull().default(false),
  reachable: boolean("reachable").notNull().default(false),
  workloadAuthorized: boolean("workload_authorized").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m093HomelabNetworkZones = pgTable("m093_homelab_network_zones", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  purpose: text("purpose").notNull(),
  trustClass: text("trust_class").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  defaultDenyRequired: boolean("default_deny_required").notNull().default(true),
  segmentationApplied: boolean("segmentation_applied").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m093HomelabRemoteAccessProfiles = pgTable("m093_homelab_remote_access_profiles", {
  id: uuid("id").primaryKey(),
  siteId: uuid("site_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  identityMfaRequired: boolean("identity_mfa_required").notNull().default(true),
  remoteAccessGranted: boolean("remote_access_granted").notNull().default(false),
  applicationAuthorizationGranted: boolean("application_authorization_granted").notNull().default(false),
  publicManagementExposed: boolean("public_management_exposed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m093HomelabProvisioningRequests = pgTable("m093_homelab_provisioning_requests", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  provisioningExecuted: boolean("provisioning_executed").notNull().default(false),
  networkConfigured: boolean("network_configured").notNull().default(false),
  storageConfigured: boolean("storage_configured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
