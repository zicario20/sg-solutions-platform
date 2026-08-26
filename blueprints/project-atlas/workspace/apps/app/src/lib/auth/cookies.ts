export function createAuthSessionCookie(handle: string) {
  if (!handle || /[;\r\n]/u.test(handle)) throw new Error("AUTH_COOKIE_HANDLE_INVALID");
  return {
    serialize: () =>
      `__Host-atlas_auth=${encodeURIComponent(handle)}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  };
}
