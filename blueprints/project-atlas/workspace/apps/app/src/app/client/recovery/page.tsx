import { AuthField, authFormAttributes, AuthShell } from "@atlas/ui";
import { currentAuthCopy } from "../../../lib/auth/locale.ts";
export default function Page({ searchParams }: { searchParams: { locale?: string } }) { const copy = currentAuthCopy(searchParams.locale); return <AuthShell title={copy.recovery}><form {...authFormAttributes("recovery")}><AuthField label={copy.email} type="email" autoComplete="email" /><button type="submit">{copy.continue}</button><p aria-live="polite">{copy.neutralRecovery}</p></form></AuthShell>; }
