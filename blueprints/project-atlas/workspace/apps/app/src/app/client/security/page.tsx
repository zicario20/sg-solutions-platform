import { AccountSecurityView } from "@atlas/ui";
import { loadConfiguredAuthSessions } from "../../../lib/auth/http.ts";
import { requirePrivateAuthPageContext } from "../../../lib/auth/private-page-context.ts";
import { toSafeAuthSessionRows } from "../../../lib/auth/safe-session-rows.ts";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  const context = await requirePrivateAuthPageContext(params.locale, params.outcome);
  const sessions = await loadConfiguredAuthSessions(context.sessionHandle);
  const formatter = new Intl.DateTimeFormat(context.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const safeSessions = toSafeAuthSessionRows(
    sessions.map((session) => ({
      id: session.id,
      current: session.current === true,
      createdAtLabel: session.createdAt
        ? formatter.format(session.createdAt)
        : context.copy.sessions,
    })),
    context.copy.session,
  );
  return (
    <AccountSecurityView
      locale={context.locale}
      copy={context.copy}
      csrf={context.csrf}
      outcome={context.outcome}
      sessions={safeSessions}
      returnTo="/client/security"
    />
  );
}
