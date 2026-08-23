"use client";
import { secureMessagingCopy } from "@atlas/i18n";
import type { DashboardLocale } from "@atlas/dashboard";
import { useEffect, useState } from "react";
type InboxItem = Readonly<{
  opaqueRef: string;
  subject: string;
  state: string;
  preview: string;
  updatedAt: string;
}>;
export function SecureMessagingPortal({
  locale,
  state,
}: {
  locale: DashboardLocale;
  state: "unavailable" | "ready";
}) {
  const copy = secureMessagingCopy[locale];
  const [items, setItems] = useState<readonly InboxItem[] | undefined>();
  const [unavailable, setUnavailable] = useState(state === "unavailable");
  useEffect(() => {
    if (state !== "ready") return;
    let active = true;
    fetch("/api/client/messages", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => ({ response, body: await response.json().catch(() => undefined) }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok || !body || !Array.isArray(body.items)) {
          setUnavailable(true);
          return;
        }
        setItems(body.items);
      })
      .catch(() => active && setUnavailable(true));
    return () => {
      active = false;
    };
  }, [state]);
  return (
    <section className="secure-messaging" aria-labelledby="messages-title">
      <header>
        <p>Secure portal</p>
        <h1 id="messages-title">{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      {unavailable ? (
        <div role="status">
          <p>{copy.unavailable}</p>
        </div>
      ) : items === undefined ? (
        <div role="status">
          <p>{copy.intro}</p>
        </div>
      ) : items.length === 0 ? (
        <div role="status">
          <p>{copy.empty}</p>
        </div>
      ) : (
        <ul aria-label={copy.title}>
          {items.map((item) => (
            <li key={item.opaqueRef}>
              <a href={`/client/messages/${encodeURIComponent(item.opaqueRef)}`}>
                <strong>{item.subject}</strong>
                <span>{item.preview}</span>
                <span>{item.state}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
