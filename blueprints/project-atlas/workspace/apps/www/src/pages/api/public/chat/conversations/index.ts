import type { APIRoute } from "astro";
import { getPublicChatRuntime } from "../../../../../lib/public-chat/runtime.ts";

export const prerender = false;

export const POST: APIRoute = ({ request }) => getPublicChatRuntime().handlers.start(request);
