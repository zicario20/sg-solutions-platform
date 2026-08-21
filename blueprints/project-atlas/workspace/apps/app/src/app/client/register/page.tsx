import { AuthField, authFormAttributes, AuthShell } from "@atlas/ui";
import { currentAuthCopy } from "../../../lib/auth/locale.ts";
export default function Page({ searchParams }: { searchParams: { locale?: string } }) { const copy = currentAuthCopy(searchParams.locale); return <AuthShell title={copy.register}><form {...authFormAttributes("register")}><AuthField label={copy.email} type="email" autoComplete="email" /><AuthField label={copy.password} type="password" autoComplete="new-password" /><button type="submit">{copy.continue}</button></form></AuthShell>; }
