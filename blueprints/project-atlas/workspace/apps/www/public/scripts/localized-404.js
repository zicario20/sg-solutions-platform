const page = document.querySelector("[data-localized-404]");

if (page instanceof HTMLElement && /^\/en(?:\/|$)/.test(window.location.pathname)) {
  document.documentElement.lang = "en";
  document.title = page.dataset.enTitle ?? document.title;

  for (const element of document.querySelectorAll("[data-en-text]")) {
    if (element instanceof HTMLElement && element.dataset.enText) {
      element.textContent = element.dataset.enText;
    }
  }

  for (const link of document.querySelectorAll("a[data-en-href]")) {
    if (link instanceof HTMLAnchorElement && link.dataset.enHref) {
      link.href = link.dataset.enHref;
    }
  }
}
