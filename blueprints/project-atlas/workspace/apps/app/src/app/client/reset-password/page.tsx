import { AuthField, AuthShell } from "@atlas/ui";
export default function Page() { return <AuthShell title="Restablecer contraseña"><form><AuthField label="Nueva contraseña" type="password" autoComplete="new-password" /><button>Continuar</button></form></AuthShell>; }
