import { resolveAuthPageLocale } from "@atlas/i18n";
import { DashboardLoadingView } from "@atlas/ui";
import { cookies } from "next/headers";
import { AUTH_LOCALE_COOKIE } from "../../lib/auth/locale.ts";

export default async function Loading() {
  const store = await cookies();
  return <DashboardLoadingView locale={resolveAuthPageLocale(undefined, store.get(AUTH_LOCALE_COOKIE)?.value)} />;
}
