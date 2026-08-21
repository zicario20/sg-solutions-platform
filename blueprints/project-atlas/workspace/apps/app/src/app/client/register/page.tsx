import { AuthField, AuthShell } from "@atlas/ui";
export default function Page() { return <AuthShell title="Crear acceso"><form><AuthField label="Correo electrónico" type="email" autoComplete="email" /><AuthField label="Nueva contraseña" type="password" autoComplete="new-password" /><button type="submit">Continuar</button></form></AuthShell>; }
