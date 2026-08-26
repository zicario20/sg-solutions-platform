"use client";
import { ClientServicesRouteError } from "@atlas/ui";
export default function ClientServiceDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ClientServicesRouteError reset={reset} detail />;
}
