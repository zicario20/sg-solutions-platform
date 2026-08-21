import { AuthField, authFormAttributes, AuthShell } from "@atlas/ui";
import { currentAuthCopy } from "../../../lib/auth/locale.ts";
export default function Page({ searchParams }: { searchParams: { locale?: string } }) { const copy = currentAuthCopy(searchParams.locale); return <AuthShell title={copy.reset}><form {...authFormAttributes("recovery")}><AuthField label={copy.password} name="new_password" type="password" autoComplete="new-password" /><button type="submit">{copy.continue}</button><p aria-live="polite">{copy.neutralReset}</p></form></AuthShell>; }
