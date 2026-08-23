import { handleDocumentLandingGet } from "../../../../lib/documents/http.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(request: Request) {
  return handleDocumentLandingGet(request);
}
