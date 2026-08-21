import { AuthApplicationFacade } from "./facade.ts";

const facade = new AuthApplicationFacade("https://app.example");

export async function authPost(request: Request): Promise<Response> {
  const result = await facade.postLogin(request.headers.get("origin"));
  return Response.json(result.body, { status: result.status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
}

export async function authGet(): Promise<Response> {
  return Response.json({ kind: "unavailable" }, { status: 503, headers: { "cache-control": "private, no-store" } });
}
