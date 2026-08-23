export function documentNoStoreJson(status: number, body: Readonly<Record<string, string>>) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
  });
}

export async function handleDocumentLandingGet(request: Request) {
  if (request.method !== "GET") return documentNoStoreJson(405, { error: "method_not_allowed" });
  if (request.headers.get("content-length") && Number(request.headers.get("content-length")) > 0)
    return documentNoStoreJson(413, { error: "request_too_large" });
  return documentNoStoreJson(503, { error: "temporarily_unavailable" });
}
