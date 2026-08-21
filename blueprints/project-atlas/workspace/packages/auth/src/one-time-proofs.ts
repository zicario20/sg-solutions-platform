export function assertSameOriginCsrf(
  input: { readonly origin?: string; readonly csrf?: string },
  canonicalOrigin: string,
  expectedCsrf: string,
): void {
  if (input.origin !== canonicalOrigin) throw new Error("CSRF_ORIGIN_DENIED");
  if (!input.csrf || input.csrf !== expectedCsrf) throw new Error("CSRF_TOKEN_DENIED");
}
