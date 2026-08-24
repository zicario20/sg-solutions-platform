import {
  type AdminDashboardAuthorizationSnapshot,
  type AdminDashboardDto,
  type AdminDashboardEvidenceState,
  type AdminDashboardLocale,
  type AdminDashboardWidgetData,
  type AdminDashboardWidgetDefinition,
  type AdminDashboardWidgetResult,
  assertAdminDashboardSafeData,
  authorizedAdminWidgets,
} from "./contracts.ts";
import { prioritizeAdminWork } from "./priority.ts";

export type AdminDashboardAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{ sessionHandle: string; locale: AdminDashboardLocale }>,
  ): Promise<AdminDashboardAuthorizationSnapshot | undefined>;
  revalidate(snapshot: AdminDashboardAuthorizationSnapshot): Promise<boolean>;
}>;
export type AdminDashboardOwnerPort = Readonly<{
  query(
    input: Readonly<{
      snapshot: AdminDashboardAuthorizationSnapshot;
      widget: AdminDashboardWidgetDefinition;
      signal: AbortSignal;
    }>,
  ): Promise<
    Readonly<{
      state: Exclude<AdminDashboardEvidenceState, "unavailable" | "suppressed">;
      asOf?: string;
      data?: AdminDashboardWidgetData;
    }>
  >;
}>;
export type AdminDashboardQueryResult =
  | Readonly<{ kind: "authorized"; dto: AdminDashboardDto }>
  | Readonly<{ kind: "denied" | "retry_required" }>;

const unavailable = (widget: AdminDashboardWidgetDefinition): AdminDashboardWidgetResult =>
  Object.freeze({
    code: widget.code,
    title: widget.titleKey,
    state: "unavailable",
    safeReason: "source_unavailable",
  });
function normalize(
  widget: AdminDashboardWidgetDefinition,
  fragment: Awaited<ReturnType<AdminDashboardOwnerPort["query"]>>,
): AdminDashboardWidgetResult {
  assertAdminDashboardSafeData(fragment.data);
  const data = fragment.data?.items
    ? Object.freeze({ ...fragment.data, items: prioritizeAdminWork(fragment.data.items) })
    : fragment.data;
  return Object.freeze({
    code: widget.code,
    title: widget.titleKey,
    state: fragment.state,
    ...(fragment.asOf ? { asOf: fragment.asOf } : {}),
    ...(data ? { data } : {}),
  });
}
export class AdminDashboardQueryService {
  constructor(
    private readonly authPort: AdminDashboardAuthorizationPort,
    private readonly ownerPort: AdminDashboardOwnerPort,
    private readonly timeoutMs = 500,
  ) {}
  async query(
    input: Readonly<{ sessionHandle: string; locale: AdminDashboardLocale }>,
  ): Promise<AdminDashboardQueryResult> {
    const snapshot = await this.authPort.authorize(input);
    if (!snapshot) return { kind: "denied" };
    const widgets = authorizedAdminWidgets(snapshot);
    const results = await Promise.all(
      widgets.map(async (widget) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          return normalize(
            widget,
            await this.ownerPort.query({ snapshot, widget, signal: controller.signal }),
          );
        } catch {
          return unavailable(widget);
        } finally {
          clearTimeout(timeout);
        }
      }),
    );
    if (!(await this.authPort.revalidate(snapshot))) return { kind: "retry_required" };
    return Object.freeze({
      kind: "authorized",
      dto: Object.freeze({
        locale: snapshot.locale,
        generatedAt: new Date().toISOString(),
        widgets: Object.freeze(results),
      }),
    });
  }
}
