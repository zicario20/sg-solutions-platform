import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m095GpuNodes = pgTable("m095_gpu_nodes", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  homelabNodeReference: text("homelab_node_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  ready: boolean("ready").notNull().default(false),
  schedulerConnected: boolean("scheduler_connected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuDevices = pgTable("m095_gpu_devices", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  code: text("code").notNull().unique(),
  modelReference: text("model_reference").notNull(),
  vramClass: text("vram_class").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  driverCompatible: boolean("driver_compatible").notNull().default(false),
  rawSerialStored: boolean("raw_serial_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuRuntimes = pgTable("m095_gpu_runtimes", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  code: text("code").notNull().unique(),
  engineReference: text("engine_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  driverVerified: boolean("driver_verified").notNull().default(false),
  cudaVerified: boolean("cuda_verified").notNull().default(false),
  endpointExposed: boolean("endpoint_exposed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuModelProfiles = pgTable("m095_gpu_model_profiles", {
  id: uuid("id").primaryKey(),
  runtimeId: uuid("runtime_id").notNull(),
  code: text("code").notNull().unique(),
  artifactChecksumReference: text("artifact_checksum_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  workloadCertified: boolean("workload_certified").notNull().default(false),
  toolAuthorityGranted: boolean("tool_authority_granted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuResourceBudgets = pgTable("m095_gpu_resource_budgets", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  thermalLimitsVerified: boolean("thermal_limits_verified").notNull().default(false),
  powerLimitsVerified: boolean("power_limits_verified").notNull().default(false),
  vramReserveVerified: boolean("vram_reserve_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuInferenceRequests = pgTable("m095_gpu_inference_requests", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  modelProfileId: uuid("model_profile_id").notNull(),
  code: text("code").notNull().unique(),
  workloadClass: text("workload_class").notNull(),
  status: text("status").notNull(),
  dispatched: boolean("dispatched").notNull().default(false),
  modelCalled: boolean("model_called").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuToolRequests = pgTable("m095_gpu_tool_requests", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  requestedToolReference: text("requested_tool_reference").notNull(),
  status: text("status").notNull(),
  toolExecuted: boolean("tool_executed").notNull().default(false),
  modelTextTrustedForExecution: boolean("model_text_trusted_for_execution").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m095GpuModelLoadRequests = pgTable("m095_gpu_model_load_requests", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  modelProfileId: uuid("model_profile_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  loaded: boolean("loaded").notNull().default(false),
  driverInstalled: boolean("driver_installed").notNull().default(false),
  gpuMemoryAllocated: boolean("gpu_memory_allocated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
