import { dashboardContextPost } from "../../../../../lib/dashboard/http.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function POST(request: Request) {
  return dashboardContextPost(request);
}
