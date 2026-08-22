"use client";

import { DashboardErrorView } from "@atlas/ui";

export default function ErrorPage({ reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const locale = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "es";
  return <DashboardErrorView locale={locale} onRetry={reset} />;
}
