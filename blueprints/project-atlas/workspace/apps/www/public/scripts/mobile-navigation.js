for (const menu of document.querySelectorAll("[data-mobile-navigation]")) {
  const trigger = menu.querySelector("summary[aria-controls]");
  if (!(menu instanceof HTMLDetailsElement) || !(trigger instanceof HTMLElement)) continue;

  const synchronizeState = () => {
    trigger.setAttribute("aria-expanded", String(menu.open));
  };

  menu.addEventListener("toggle", synchronizeState);
  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menu.open) return;
    menu.open = false;
    synchronizeState();
    trigger.focus();
  });
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.open = false;
      synchronizeState();
    });
  });
  synchronizeState();
}
