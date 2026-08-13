import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_CHAT_COPY } from "../../apps/www/src/content/public-chat.ts";

const read = (path: string) => readFileSync(path, "utf8");

describe("M003 bilingual public chat UI contract", () => {
  it("provides equivalent automated identity, privacy, human and recovery copy", () => {
    for (const locale of ["es", "en"] as const) {
      const copy = PUBLIC_CHAT_COPY[locale];
      expect(copy.notice.length).toBeGreaterThan(100);
      expect(copy.greeting.length).toBeGreaterThan(30);
      expect(copy.quickActions.human.length).toBeGreaterThan(8);
      expect(copy.errors.temporarilyUnavailable.length).toBeGreaterThan(20);
      expect(copy.orientation.noMatch.length).toBeGreaterThan(40);
    }
  });

  it("renders one shared experience with dialog, live region, notices and human support", () => {
    const experience = read("apps/www/src/components/chat/ChatExperience.astro");
    const panel = read("apps/www/src/components/chat/ChatPanel.astro");
    const transcript = read("apps/www/src/components/chat/ChatTranscript.astro");
    const composer = read("apps/www/src/components/chat/ChatComposer.astro");
    expect(experience).toContain("data-public-chat-root");
    expect(panel).toContain('role="dialog"');
    expect(panel).toContain('aria-live="polite"');
    expect(panel).toContain('role="alert"');
    expect(transcript).toContain('role="log"');
    expect(transcript).toContain('aria-relevant="additions text"');
    expect(panel).toContain("data-public-chat-human");
    expect(panel).toContain("data-public-chat-notice");
    expect(composer).toContain('maxlength="2000"');
  });

  it("uses safe dynamic rendering and never persists chat state in browser storage", () => {
    const controller = read("apps/www/src/scripts/public-chat.ts");
    const resumeRoute = read("apps/www/src/pages/api/public/chat/conversations/[id]/resume.ts");
    expect(controller).toContain("textContent");
    expect(controller).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/u);
    expect(controller).not.toMatch(/localStorage|sessionStorage|indexedDB/u);
    expect(controller).toContain("x-atlas-chat-csrf");
    expect(controller).toContain('credentials: "same-origin"');
    expect(controller).toContain("resetConversationUi");
    expect(controller).toContain("resumeConversation");
    expect(controller).toContain("{ resume: true }");
    expect(controller).toContain("changeConversationLocale");
    expect(controller).toContain("AbortController");
    expect(controller).not.toContain("approvedTransport");
    expect(resumeRoute).toContain("export const POST");
    expect(resumeRoute).not.toContain("export const GET");
  });

  it("does not expose a permanently clipped focus target inside the modal trap", () => {
    const panel = read("apps/www/src/components/chat/ChatPanel.astro");
    expect(panel).not.toContain('<a class="sr-only"');
  });

  it("meets minimum target, narrow-screen, zoom and reduced-motion contracts", () => {
    const styles = read("apps/www/src/styles/public-chat.css");
    expect(styles).toContain("min-width: var(--control-min-size)");
    expect(styles).toContain("min-height: var(--control-min-size)");
    expect(styles).toContain("@media (max-width: 640px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("max-width: 100%");
  });

  it("exposes localized full-page fallbacks without indexing private conversation state", () => {
    const spanish = read("apps/www/src/pages/chat.astro");
    const english = read("apps/www/src/pages/en/chat.astro");
    expect(spanish).toContain('locale="es"');
    expect(english).toContain('locale="en"');
    expect(spanish).toContain('alternatePath="/en/chat/"');
    expect(english).toContain('alternatePath="/chat/"');
  });
});
