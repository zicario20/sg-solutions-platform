import { M043_DEFAULT_WEBHOOK_MAX_BYTES, verifyStripeSignatureWithRotation } from "@atlas/billing";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const headers = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};
export async function POST(request: Request) {
  const ingressEnabled =
    process.env.M043_STRIPE_PAYMENTS_ENABLED === "true" &&
    process.env.M043_STRIPE_WEBHOOK_INGRESS_ENABLED === "true" &&
    process.env.M014_PAYMENTS_ENABLED === "true";
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.M043_STRIPE_WEBHOOK_PREVIOUS_SECRET,
  ].filter((secret): secret is string => Boolean(secret));
  if (!ingressEnabled || secrets.length === 0)
    return Response.json({ error: "temporarily_unavailable" }, { status: 503, headers });
  const length = Number(request.headers.get("content-length"));
  const maxBytes = Number(
    process.env.M043_STRIPE_WEBHOOK_MAX_BYTES ?? M043_DEFAULT_WEBHOOK_MAX_BYTES,
  );
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1_048_576)
    return Response.json({ error: "temporarily_unavailable" }, { status: 503, headers });
  if (Number.isFinite(length) && length > maxBytes)
    return Response.json({ error: "invalid_request" }, { status: 413, headers });
  const raw = new Uint8Array(await request.arrayBuffer());
  if (
    raw.byteLength > maxBytes ||
    !verifyStripeSignatureWithRotation(raw, request.headers.get("stripe-signature"), secrets)
  )
    return Response.json({ error: "invalid_request" }, { status: 400, headers });
  return Response.json(
    { accepted: false, reason: "m043_provider_runtime_not_configured" },
    { status: 503, headers },
  );
}
