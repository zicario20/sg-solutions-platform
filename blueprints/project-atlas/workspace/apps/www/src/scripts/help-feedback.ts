import type { Locale } from "../domain/public-site";

export interface HelpFeedbackEvent {
  name: "help_feedback_selected";
  detail: { contentId: string; locale: Locale; helpful: boolean };
}

export function createHelpFeedbackEvent(
  contentId: string,
  locale: Locale,
  helpful: boolean,
): HelpFeedbackEvent {
  if (!/^[a-z0-9-]+$/.test(contentId)) throw new Error("Invalid help content id");
  return { name: "help_feedback_selected", detail: { contentId, locale, helpful } };
}

export function getFeedbackUnavailableMessage(locale: Locale): string {
  return locale === "es"
    ? "La respuesta se registró solo en esta página y no se envió porque la recopilación de feedback aún no está activa."
    : "The response was recorded only on this page and was not transmitted because feedback collection is not active yet.";
}

export function initializeHelpFeedback(root: ParentNode = document): void {
  for (const container of root.querySelectorAll<HTMLElement>("[data-help-feedback]")) {
    const contentId = container.dataset.contentId;
    const locale: Locale = container.dataset.locale === "es" ? "es" : "en";
    const status = container.querySelector<HTMLElement>("[data-help-feedback-status]");
    if (!contentId || !status) continue;
    for (const button of container.querySelectorAll<HTMLButtonElement>("button[data-helpful]")) {
      button.addEventListener("click", () => {
        const event = createHelpFeedbackEvent(contentId, locale, button.dataset.helpful === "yes");
        container.dispatchEvent(
          new CustomEvent(event.name, { bubbles: true, detail: event.detail }),
        );
        for (const choice of container.querySelectorAll<HTMLButtonElement>(
          "button[data-helpful]",
        )) {
          choice.setAttribute("aria-pressed", String(choice === button));
        }
        status.textContent = getFeedbackUnavailableMessage(locale);
      });
    }
  }
}
