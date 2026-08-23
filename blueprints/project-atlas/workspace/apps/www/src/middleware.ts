import type { MiddlewareHandler } from "astro";

const productionContentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'none'; img-src 'self' data:; script-src 'self' 'sha256-8rtwxOeuYi+PH5f+clr6e49f3EJyaXY6gyBdRtlaETw='; style-src 'self'; connect-src 'self'; form-action 'self';";
const developmentContentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'none'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self';";

const APP_SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": import.meta.env.DEV
    ? developmentContentSecurityPolicy
    : productionContentSecurityPolicy,
} as const;

const shouldProtect = (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  return (
    contentType.includes("text/html") ||
    contentType.includes("application/json") ||
    contentType.includes("text/plain") ||
    contentType.includes("text/xml")
  );
};

export const onRequest: MiddlewareHandler = async (_, next) => {
  const response = await next();
  if (!shouldProtect(response)) {
    return response;
  }

  for (const [headerName, headerValue] of Object.entries(APP_SECURITY_HEADERS)) {
    if (!response.headers.has(headerName)) {
      response.headers.set(headerName, headerValue);
    }
  }

  return response;
};
