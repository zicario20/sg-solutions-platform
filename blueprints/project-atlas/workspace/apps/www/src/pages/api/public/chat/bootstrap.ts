import type { APIRoute } from "astro";
import { getPublicChatRuntime } from "../../../../lib/public-chat/runtime.ts";

export const prerender = false;

export const GET: APIRoute = ({ request }) => getPublicChatRuntime().bootstrap(request);
export const OPTIONS: APIRoute = ({ request }) => getPublicChatRuntime().bootstrap(request);
