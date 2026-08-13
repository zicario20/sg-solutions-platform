import type { APIRoute } from "astro";
import { getPublicChatRuntime } from "../../../../../../lib/public-chat/runtime.ts";

export const prerender = false;

export const GET: APIRoute = ({ params, request }) =>
  getPublicChatRuntime().handlers.resume(params.id ?? "", request);
