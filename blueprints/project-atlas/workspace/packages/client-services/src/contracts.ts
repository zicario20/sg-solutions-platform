export const CLIENT_SERVICE_LIST_LIMIT = 24,
  CLIENT_SERVICE_SECTION_LIMIT = 20,
  CLIENT_SERVICE_MILESTONE_LIMIT = 24;
export const CLIENT_SERVICE_REF_PATTERN = /^csr1_[A-Za-z0-9_-]{32}$/u;
export const CLIENT_SERVICE_SECTION_NAMES = [
  "timeline",
  "tasks",
  "documents",
  "payments",
  "appointments",
  "messages",
  "agreements",
  "deliverables",
] as const;
export type ClientServiceSectionName = (typeof CLIENT_SERVICE_SECTION_NAMES)[number];
export type ClientServiceLocale = "es" | "en";
export type ClientServiceContextType = "personal" | "organization";
export type ClientServicePublicState =
  | "preliminary"
  | "payment_pending"
  | "pending_review"
  | "approved_to_start"
  | "in_progress"
  | "waiting_client"
  | "waiting_external"
  | "completed"
  | "cancelled"
  | "partially_refunded"
  | "refunded"
  | "disputed"
  | "unconfirmed";
export type ClientServiceCommercialState = "preliminary" | "active" | "cancelled";
export type ClientServiceFinancialState =
  | "unpaid"
  | "processing"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "disputed"
  | "cancelled"
  | "unavailable";
export type ClientServiceActivationState =
  | "pending_review"
  | "approved"
  | "declined"
  | "not_required"
  | "unavailable";
export type ClientServiceFulfillmentState =
  | "not_started"
  | "in_progress"
  | "waiting_client"
  | "waiting_external"
  | "completed"
  | "cancelled"
  | "unavailable";
export interface ClientServiceAxesDto {
  commercial: ClientServiceCommercialState;
  financial: ClientServiceFinancialState;
  activation: ClientServiceActivationState;
  fulfillment: ClientServiceFulfillmentState;
}
export interface ClientServicePublicContextDto {
  type: ClientServiceContextType;
  label: string;
}
export interface ClientServicePublicMilestoneDto {
  label: string;
  stateLabel: string;
  date?: string;
}
export interface ClientServiceCardDto {
  opaqueRef: string;
  publicReference: string;
  context: ClientServicePublicContextDto;
  serviceName: string;
  categoryLabel: string;
  publicState: ClientServicePublicState;
  publicStateLabel: string;
  axes: ClientServiceAxesDto;
  axisLabels: { commercial: string; financial: string; activation: string; fulfillment: string };
  currentMilestone?: ClientServicePublicMilestoneDto;
  milestones: { completed: number; total: number };
  nextStepLabel?: string;
  updatedAt: string;
}
export interface ClientServiceSectionItemDto {
  label: string;
  stateLabel?: string;
  date?: string;
  routeKey?: "status" | "documents" | "appointments" | "messages" | "payments" | "help";
}
export type ClientServiceSectionDto =
  | { state: "fresh"; generatedAt: string; data: readonly ClientServiceSectionItemDto[] }
  | { state: "empty"; generatedAt: string }
  | {
      state: "stale" | "unavailable";
      generatedAt: string;
      reason?: "source_unavailable" | "stale_projection" | "provider_disabled" | "timeout";
    };
export interface ClientServiceListDto {
  schemaVersion: "m009.list.v2";
  context: ClientServicePublicContextDto;
  items: readonly ClientServiceCardDto[];
}
export interface ClientServiceDetailDto {
  schemaVersion: "m009.detail.v2";
  context: ClientServicePublicContextDto;
  service: ClientServiceCardDto;
  scopeLabel: string;
  milestones: readonly ClientServicePublicMilestoneDto[];
  sections: Record<ClientServiceSectionName, ClientServiceSectionDto>;
}
export const CLIENT_SERVICE_PUBLIC_STATES = [
  "preliminary",
  "payment_pending",
  "pending_review",
  "approved_to_start",
  "in_progress",
  "waiting_client",
  "waiting_external",
  "completed",
  "cancelled",
  "partially_refunded",
  "refunded",
  "disputed",
  "unconfirmed",
] as const;
const PUBLIC = CLIENT_SERVICE_PUBLIC_STATES,
  COMM = ["preliminary", "active", "cancelled"] as const,
  FIN = [
    "unpaid",
    "processing",
    "paid",
    "partially_refunded",
    "refunded",
    "disputed",
    "cancelled",
    "unavailable",
  ] as const,
  ACT = ["pending_review", "approved", "declined", "not_required", "unavailable"] as const,
  FULL = [
    "not_started",
    "in_progress",
    "waiting_client",
    "waiting_external",
    "completed",
    "cancelled",
    "unavailable",
  ] as const,
  ROUTES = ["status", "documents", "appointments", "messages", "payments", "help"] as const;
function rec(v: unknown, n: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new TypeError(`${n} object required`);
  return v as Record<string, unknown>;
}
function exact(v: Record<string, unknown>, keys: readonly string[], n: string) {
  const a = new Set(keys);
  for (const k of Object.keys(v)) if (!a.has(k)) throw new TypeError(`${n}.${k} is not allowed`);
}
function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f);
}
function str(v: unknown, n: string, max = 160) {
  if (typeof v !== "string" || !v.trim() || v.length > max || hasControlCharacter(v))
    throw new TypeError(`${n} invalid`);
  return v;
}
function iso(v: unknown, n: string) {
  const s = str(v, n, 40);
  if (!Number.isFinite(Date.parse(s)) || !s.endsWith("Z")) throw new TypeError(`${n} invalid`);
  return s;
}
function one<T extends string>(v: unknown, a: readonly T[], n: string): T {
  if (typeof v !== "string" || !a.includes(v as T)) throw new TypeError(`${n} invalid`);
  return v as T;
}
function num(v: unknown, n: string) {
  if (!Number.isSafeInteger(v) || Number(v) < 0 || Number(v) > CLIENT_SERVICE_MILESTONE_LIMIT)
    throw new TypeError(`${n} invalid`);
  return Number(v);
}
function context(v: unknown): ClientServicePublicContextDto {
  const x = rec(v, "context");
  exact(x, ["type", "label"], "context");
  return {
    type: one(x.type, ["personal", "organization"] as const, "context.type"),
    label: str(x.label, "context.label", 120),
  };
}
function milestone(v: unknown): ClientServicePublicMilestoneDto {
  const x = rec(v, "milestone");
  exact(x, ["label", "stateLabel", "date"], "milestone");
  const o: ClientServicePublicMilestoneDto = {
    label: str(x.label, "milestone.label"),
    stateLabel: str(x.stateLabel, "milestone.stateLabel", 80),
  };
  if (x.date !== undefined) o.date = iso(x.date, "milestone.date");
  return o;
}
export function parseClientServiceCardDto(v: unknown): ClientServiceCardDto {
  const x = rec(v, "service");
  exact(
    x,
    [
      "opaqueRef",
      "publicReference",
      "context",
      "serviceName",
      "categoryLabel",
      "publicState",
      "publicStateLabel",
      "axes",
      "axisLabels",
      "currentMilestone",
      "milestones",
      "nextStepLabel",
      "updatedAt",
    ],
    "service",
  );
  const opaqueRef = str(x.opaqueRef, "opaqueRef", 37);
  if (!CLIENT_SERVICE_REF_PATTERN.test(opaqueRef)) throw new TypeError("opaqueRef invalid");
  const a = rec(x.axes, "axes"),
    l = rec(x.axisLabels, "axisLabels"),
    p = rec(x.milestones, "milestones");
  exact(a, ["commercial", "financial", "activation", "fulfillment"], "axes");
  exact(l, ["commercial", "financial", "activation", "fulfillment"], "axisLabels");
  exact(p, ["completed", "total"], "milestones");
  const completed = num(p.completed, "completed"),
    total = num(p.total, "total");
  if (completed > total) throw new TypeError("milestone progress invalid");
  const o: ClientServiceCardDto = {
    opaqueRef,
    publicReference: str(x.publicReference, "publicReference", 48),
    context: context(x.context),
    serviceName: str(x.serviceName, "serviceName"),
    categoryLabel: str(x.categoryLabel, "categoryLabel"),
    publicState: one(x.publicState, PUBLIC, "publicState"),
    publicStateLabel: str(x.publicStateLabel, "publicStateLabel", 80),
    axes: {
      commercial: one(a.commercial, COMM, "commercial"),
      financial: one(a.financial, FIN, "financial"),
      activation: one(a.activation, ACT, "activation"),
      fulfillment: one(a.fulfillment, FULL, "fulfillment"),
    },
    axisLabels: {
      commercial: str(l.commercial, "commercialLabel", 80),
      financial: str(l.financial, "financialLabel", 80),
      activation: str(l.activation, "activationLabel", 80),
      fulfillment: str(l.fulfillment, "fulfillmentLabel", 80),
    },
    milestones: { completed, total },
    updatedAt: iso(x.updatedAt, "updatedAt"),
  };
  if (x.currentMilestone !== undefined) o.currentMilestone = milestone(x.currentMilestone);
  if (x.nextStepLabel !== undefined) o.nextStepLabel = str(x.nextStepLabel, "nextStepLabel");
  return o;
}
export function parseClientServiceListDto(v: unknown): ClientServiceListDto {
  const x = rec(v, "list");
  exact(x, ["schemaVersion", "context", "items"], "list");
  if (
    x.schemaVersion !== "m009.list.v2" ||
    !Array.isArray(x.items) ||
    x.items.length > CLIENT_SERVICE_LIST_LIMIT
  )
    throw new TypeError("list invalid");
  const c = context(x.context),
    items = x.items.map(parseClientServiceCardDto);
  if (items.some((i) => i.context.type !== c.type || i.context.label !== c.label))
    throw new TypeError("context mismatch");
  return { schemaVersion: "m009.list.v2", context: c, items };
}
function item(v: unknown): ClientServiceSectionItemDto {
  const x = rec(v, "item");
  exact(x, ["label", "stateLabel", "date", "routeKey"], "item");
  const o: ClientServiceSectionItemDto = { label: str(x.label, "label") };
  if (x.stateLabel !== undefined) o.stateLabel = str(x.stateLabel, "stateLabel", 80);
  if (x.date !== undefined) o.date = iso(x.date, "date");
  if (x.routeKey !== undefined) o.routeKey = one(x.routeKey, ROUTES, "routeKey");
  return o;
}
export function parseClientServiceSection(v: unknown): ClientServiceSectionDto {
  const x = rec(v, "section");
  exact(x, ["state", "generatedAt", "reason", "data"], "section");
  const state = one(x.state, ["fresh", "empty", "stale", "unavailable"] as const, "state"),
    generatedAt = iso(x.generatedAt, "generatedAt");
  if (state === "fresh") {
    if (!Array.isArray(x.data) || x.data.length > CLIENT_SERVICE_SECTION_LIMIT)
      throw new TypeError("data invalid");
    return { state, generatedAt, data: x.data.map(item) };
  }
  if (x.data !== undefined) throw new TypeError("non-fresh data forbidden");
  if (state === "empty") return { state, generatedAt };
  const reason =
    x.reason === undefined
      ? undefined
      : one(
          x.reason,
          ["source_unavailable", "stale_projection", "provider_disabled", "timeout"] as const,
          "reason",
        );
  return reason ? { state, generatedAt, reason } : { state, generatedAt };
}
export function parseClientServiceDetailDto(v: unknown): ClientServiceDetailDto {
  const x = rec(v, "detail");
  exact(
    x,
    ["schemaVersion", "context", "service", "scopeLabel", "milestones", "sections"],
    "detail",
  );
  if (
    x.schemaVersion !== "m009.detail.v2" ||
    !Array.isArray(x.milestones) ||
    x.milestones.length > CLIENT_SERVICE_MILESTONE_LIMIT
  )
    throw new TypeError("detail invalid");
  const s = rec(x.sections, "sections");
  exact(s, CLIENT_SERVICE_SECTION_NAMES, "sections");
  const c = context(x.context),
    service = parseClientServiceCardDto(x.service);
  if (service.context.type !== c.type || service.context.label !== c.label)
    throw new TypeError("context mismatch");
  return {
    schemaVersion: "m009.detail.v2",
    context: c,
    service,
    scopeLabel: str(x.scopeLabel, "scopeLabel"),
    milestones: x.milestones.map(milestone),
    sections: Object.fromEntries(
      CLIENT_SERVICE_SECTION_NAMES.map((n) => [n, parseClientServiceSection(s[n])]),
    ) as Record<ClientServiceSectionName, ClientServiceSectionDto>,
  };
}
