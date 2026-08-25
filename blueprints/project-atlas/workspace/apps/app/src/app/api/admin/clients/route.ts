import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadConfiguredClientManagement } from "@/lib/client-management/runtime";
import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth-context";
import { resolveDashboardLocale } from "@/lib/dashboard/locale";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  const store = await cookies();
  const sessionHandle = store.get(DASHBOARD_SESSION_COOKIE)?.value;
  if (!sessionHandle)
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const locale = resolveDashboardLocale(
    store.get("atlas_locale")?.value,
    process.env.ATLAS_DEFAULT_LOCALE,
  );
  const result = await loadConfiguredClientManagement({ sessionHandle, locale });
  if (result.kind !== "authorized")
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(result.dto, { headers: { "Cache-Control": "private, no-store" } });
}
