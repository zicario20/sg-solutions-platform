import type { APIRoute } from "astro";
import { getAdminDemoState, setAdminDemoState } from "../_adminDemoStore";
import {
  jsonBadRequest,
  jsonResponse,
  jsonServerError,
  parseBody,
  requireAdminAccessWithMinimumRole,
} from "../_db";

export const prerender = false;

type BookkeepingRecord = Record<string, unknown>;

type AdminBookkeepingState = {
  bookkeepingServices: BookkeepingRecord[];
  bookkeepingEngagements: BookkeepingRecord[];
  accountingEntities: BookkeepingRecord[];
  accountingBooks: BookkeepingRecord[];
  chartAccounts: BookkeepingRecord[];
  journalEntries: BookkeepingRecord[];
  accountingPeriods: BookkeepingRecord[];
  openingBalances: BookkeepingRecord[];
  financialAccounts: BookkeepingRecord[];
  auditLog: BookkeepingRecord[];
};

type IncomingPayload = {
  state?: Partial<AdminBookkeepingState> | null;
};

const STORAGE_KEY = "admin-bookkeeping";

const INITIAL_BOOKKEEPING_STATE: AdminBookkeepingState = {
  bookkeepingServices: [],
  bookkeepingEngagements: [],
  accountingEntities: [],
  accountingBooks: [],
  chartAccounts: [],
  journalEntries: [],
  accountingPeriods: [],
  openingBalances: [],
  financialAccounts: [],
  auditLog: [],
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asRecordArray = (value: unknown): BookkeepingRecord[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is BookkeepingRecord => typeof entry === "object" && entry !== null);
};

const sanitizeState = (raw: Partial<AdminBookkeepingState>): AdminBookkeepingState => ({
  bookkeepingServices: asRecordArray(raw.bookkeepingServices),
  bookkeepingEngagements: asRecordArray(raw.bookkeepingEngagements),
  accountingEntities: asRecordArray(raw.accountingEntities),
  accountingBooks: asRecordArray(raw.accountingBooks),
  chartAccounts: asRecordArray(raw.chartAccounts),
  journalEntries: asRecordArray(raw.journalEntries),
  accountingPeriods: asRecordArray(raw.accountingPeriods),
  openingBalances: asRecordArray(raw.openingBalances),
  financialAccounts: asRecordArray(raw.financialAccounts),
  auditLog: asRecordArray(raw.auditLog),
});

const loadState = (): AdminBookkeepingState =>
  sanitizeState(getAdminDemoState<AdminBookkeepingState>(STORAGE_KEY, INITIAL_BOOKKEEPING_STATE));

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const item = loadState();
    return jsonResponse({ ok: true, item });
  } catch (error) {
    return jsonServerError("No se pudo cargar bookkeeping", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await parseBody(request)) as IncomingPayload;
  const candidate = asObject(payload?.state) ?? asObject(payload) ?? null;

  if (!candidate) {
    return jsonBadRequest("No se encontró state para guardar");
  }

  try {
    const previous = loadState();
    const next: AdminBookkeepingState = {
      bookkeepingServices: asRecordArray(candidate.bookkeepingServices ?? previous.bookkeepingServices),
      bookkeepingEngagements: asRecordArray(candidate.bookkeepingEngagements ?? previous.bookkeepingEngagements),
      accountingEntities: asRecordArray(candidate.accountingEntities ?? previous.accountingEntities),
      accountingBooks: asRecordArray(candidate.accountingBooks ?? previous.accountingBooks),
      chartAccounts: asRecordArray(candidate.chartAccounts ?? previous.chartAccounts),
      journalEntries: asRecordArray(candidate.journalEntries ?? previous.journalEntries),
      accountingPeriods: asRecordArray(candidate.accountingPeriods ?? previous.accountingPeriods),
      openingBalances: asRecordArray(candidate.openingBalances ?? previous.openingBalances),
      financialAccounts: asRecordArray(candidate.financialAccounts ?? previous.financialAccounts),
      auditLog: asRecordArray(candidate.auditLog ?? previous.auditLog),
    };

    setAdminDemoState(STORAGE_KEY, next);
    return jsonResponse({ ok: true, item: next }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo guardar bookkeeping", { message: String(error?.message ?? error) });
  }
};
