import { ResetPasswordView } from "@atlas/ui";
import { readAuthPageContext } from "../../../lib/auth/locale.ts";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  return (
    <ResetPasswordView
      {...(await readAuthPageContext(params.locale, params.outcome))}
      returnTo="/client/reset-password"
    />
  );
}
