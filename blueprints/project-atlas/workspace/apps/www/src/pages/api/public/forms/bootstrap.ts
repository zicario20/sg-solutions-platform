import type { APIRoute } from "astro";
import { publicFormsOptionsResponse } from "../../../../lib/public-forms/admission.ts";
import { getPublicFormsRuntime } from "../../../../lib/public-forms/runtime.ts";

export const prerender = false;

export const POST: APIRoute = ({ request }) => getPublicFormsRuntime().bootstrap(request);
export const OPTIONS: APIRoute = () => publicFormsOptionsResponse();
