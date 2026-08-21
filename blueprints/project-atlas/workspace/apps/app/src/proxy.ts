export function proxy(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/client") && !request.headers.get("cookie")?.includes("__Host-atlas_auth=")) {
    return Response.redirect(new URL("/client/sign-in", url), 307);
  }
  return undefined;
}
