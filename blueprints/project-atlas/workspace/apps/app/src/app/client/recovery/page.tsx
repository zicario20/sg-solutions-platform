import { AuthField, AuthShell } from "@atlas/ui";
export default function Page() { return <AuthShell title="Recuperar acceso"><form><AuthField label="Correo electrónico" type="email" autoComplete="email" /><button>Continuar</button></form></AuthShell>; }
