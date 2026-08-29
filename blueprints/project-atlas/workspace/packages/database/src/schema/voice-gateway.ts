import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m096VoiceGateways = pgTable("m096_voice_gateways", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  nodeReference: text("node_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  listenerBound: boolean("listener_bound").notNull().default(false),
  providerRegistered: boolean("provider_registered").notNull().default(false),
  mediaReady: boolean("media_ready").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m096VoiceProviderProfiles = pgTable("m096_voice_provider_profiles", {
  id: uuid("id").primaryKey(),
  gatewayId: uuid("gateway_id").notNull(),
  code: text("code").notNull().unique(),
  providerType: text("provider_type").notNull(),
  status: text("status").notNull(),
  credentialsLoaded: boolean("credentials_loaded").notNull().default(false),
  providerConnected: boolean("provider_connected").notNull().default(false),
  trustedForCallControl: boolean("trusted_for_call_control").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m096VoiceCallSessionRequests = pgTable("m096_voice_call_session_requests", {
  id: uuid("id").primaryKey(),
  gatewayId: uuid("gateway_id").notNull(),
  code: text("code").notNull().unique(),
  direction: text("direction").notNull(),
  status: text("status").notNull(),
  connected: boolean("connected").notNull().default(false),
  mediaActive: boolean("media_active").notNull().default(false),
  callerAuthenticated: boolean("caller_authenticated").notNull().default(false),
  businessContextGranted: boolean("business_context_granted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m096VoiceCaptureControls = pgTable("m096_voice_capture_controls", {
  id: uuid("id").primaryKey(),
  sessionRequestId: uuid("session_request_id").notNull(),
  code: text("code").notNull().unique(),
  consentState: text("consent_state").notNull(),
  status: text("status").notNull(),
  recordingAllowed: boolean("recording_allowed").notNull().default(false),
  transcriptionAllowed: boolean("transcription_allowed").notNull().default(false),
  rawAudioStored: boolean("raw_audio_stored").notNull().default(false),
  transcriptStored: boolean("transcript_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m096VoiceTransferRequests = pgTable("m096_voice_transfer_requests", {
  id: uuid("id").primaryKey(),
  sessionRequestId: uuid("session_request_id").notNull(),
  code: text("code").notNull().unique(),
  transferType: text("transfer_type").notNull(),
  status: text("status").notNull(),
  initiated: boolean("initiated").notNull().default(false),
  targetLegVerified: boolean("target_leg_verified").notNull().default(false),
  contextExpanded: boolean("context_expanded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
