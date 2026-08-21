export const authCopy = {
  es: { title: "Acceso seguro", email: "Correo electrónico", password: "Contraseña", unavailable: "El acceso está temporalmente no disponible", continue: "Continuar", register: "Crear acceso", recovery: "Recuperar acceso", reset: "Restablecer contraseña", verify: "Verificar correo", security: "Seguridad", sessions: "Sesiones", neutralRecovery: "Si existe una cuenta elegible, recibirá instrucciones.", neutralReset: "Si el enlace es válido, el cambio se procesará de forma segura.", providerDisabled: "El proveedor está desactivado.", closeOtherSessions: "Cerrar otras sesiones" },
  en: { title: "Secure access", email: "Email", password: "Password", unavailable: "Access is temporarily unavailable", continue: "Continue", register: "Create access", recovery: "Recover access", reset: "Reset password", verify: "Verify email", security: "Security", sessions: "Sessions", neutralRecovery: "If an eligible account exists, it will receive instructions.", neutralReset: "If the link is valid, the change will be processed securely.", providerDisabled: "The provider is disabled.", closeOtherSessions: "Close other sessions" },
} as const;

export type AuthLocale = keyof typeof authCopy;

/** Accept-Language is untrusted input; only the two shipped locales are selectable. */
export function resolveAuthLocale(value: string | null | undefined): AuthLocale {
  const language = value?.split(",", 1)[0]?.trim().toLowerCase().split("-", 1)[0];
  return language === "en" ? "en" : "es";
}
