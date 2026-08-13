import type { APIRoute } from "astro";
import { getPublicChatRuntime } from "../../../../../../lib/public-chat/runtime.ts";

export const prerender = false;

export const POST: APIRoute = ({ params, request }) =>
  getPublicChatRuntime().handlers.handoff(params.id ?? "", request);
