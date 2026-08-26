import { AccountView } from "@atlas/ui";
import { requirePrivateAuthPageContext } from "../../../../lib/auth/private-page-context.ts";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  const context = await requirePrivateAuthPageContext(params.locale, params.outcome);
  return (
    <AccountView
      locale={context.locale}
      copy={context.copy}
      csrf={context.csrf}
      outcome={context.outcome}
      returnTo="/client/settings/account"
    />
  );
}
