import type { Locale } from "../domain/public-site";

export type PublicAction = "evaluation" | "quote" | "clientPortal";

export interface PublicActionEnvironment {
  evaluationUrl?: string;
  quoteUrl?: string;
  clientPortalUrl?: string;
  allowedHosts?: string[];
}

export interface PublicActionResolution {
  available: boolean;
  href: string;
  external: boolean;
}

export function resolvePublicAction(
  action: PublicAction,
  locale: Locale,
  environment: PublicActionEnvironment,
): PublicActionResolution {
  const fallback: Record<Locale, Record<PublicAction, string>> = {
    es: {
      evaluation: "/contacto/?intent=evaluacion",
      quote: "/contacto/?intent=cotizacion",
      clientPortal: "/client/acceso/",
    },
    en: {
      evaluation: "/en/contact/?intent=evaluation",
      quote: "/en/contact/?intent=quote",
      clientPortal: "/en/client/access/",
    },
  };
  const configured = {
    evaluation: environment.evaluationUrl,
    quote: environment.quoteUrl,
    clientPortal: environment.clientPortalUrl,
  }[action];

  if (!configured) {
    return { available: false, href: fallback[locale][action], external: false };
  }

  if (isSafeInternalPath(configured)) {
    return { available: true, href: configured, external: false };
  }

  let destination: URL;
  try {
    destination = new URL(configured);
  } catch {
    throw new Error("Public action destination must be an approved https or internal path");
  }

  const allowedHosts = new Set((environment.allowedHosts ?? []).map((host) => host.toLowerCase()));
  if (destination.protocol !== "https:" || !allowedHosts.has(destination.hostname.toLowerCase())) {
    throw new Error("Public action destination must be an approved https or internal path");
  }

  return { available: true, href: destination.toString(), external: true };
}

function isSafeInternalPath(value: string): boolean {
  const containsControlOrWhitespace = Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 || /\s/.test(character);
  });
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !containsControlOrWhitespace
  );
}
