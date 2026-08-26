"use client";
import { useEffect, useState } from "react";

type Conversation = Readonly<{
  subject: string;
  state: string;
  messages: readonly Readonly<{
    opaqueRef: string;
    sender: "client" | "staff";
    body: string;
    createdAt: string;
  }>[];
}>;
export function ConversationClient({ conversationRef }: { conversationRef: string }) {
  const [conversation, setConversation] = useState<Conversation>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/api/client/messages?conversation=${encodeURIComponent(conversationRef)}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => ({ response, body: await response.json().catch(() => undefined) }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok || body?.kind !== "found") {
          setFailed(true);
          return;
        }
        setConversation(body.conversation);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [conversationRef]);
  if (failed) return <p role="status">This conversation is unavailable.</p>;
  if (!conversation) return <p role="status">Loading secure conversation…</p>;
  return (
    <section aria-labelledby="conversation-title">
      <a href="/client/messages">Back to messages</a>
      <h1 id="conversation-title">{conversation.subject}</h1>
      <p>{conversation.state}</p>
      <ol>
        {conversation.messages.map((message) => (
          <li key={message.opaqueRef}>
            <strong>{message.sender === "client" ? "You" : "SG Solutions"}</strong>
            <p>{message.body}</p>
            <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
