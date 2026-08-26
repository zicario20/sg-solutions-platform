type Answer = string | number | boolean;

export {};

type Condition =
  | { operator: "equals"; fieldCode: string; value: Answer }
  | { operator: "present"; fieldCode: string }
  | { operator: "not"; condition: Condition }
  | { operator: "all" | "any"; conditions: Condition[] };

const ROOT_SELECTOR = "[data-public-form-root]";

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing public form element: ${selector}`);
  return element;
}

function conditionValue(form: HTMLFormElement, fieldCode: string): Answer | undefined {
  const controls = form.elements.namedItem(fieldCode);
  if (controls instanceof RadioNodeList) {
    const value = controls.value;
    return value.length > 0 ? value : undefined;
  }
  if (controls instanceof HTMLInputElement) {
    if (controls.type === "checkbox") return controls.checked;
    if (controls.type === "number")
      return controls.value === "" ? undefined : Number(controls.value);
    return controls.value;
  }
  if (controls instanceof HTMLSelectElement || controls instanceof HTMLTextAreaElement) {
    return controls.value;
  }
  return undefined;
}

function evaluate(condition: Condition, form: HTMLFormElement): boolean {
  if (condition.operator === "equals")
    return conditionValue(form, condition.fieldCode) === condition.value;
  if (condition.operator === "present") {
    const value = conditionValue(form, condition.fieldCode);
    return value !== undefined && (typeof value !== "string" || value.trim().length > 0);
  }
  if (condition.operator === "not") return !evaluate(condition.condition, form);
  if (condition.operator === "all")
    return condition.conditions.every((child) => evaluate(child, form));
  return condition.conditions.some((child) => evaluate(child, form));
}

function parseCondition(value: string): Condition | undefined {
  try {
    const parsed = JSON.parse(value) as Condition;
    if (!["equals", "present", "not", "all", "any"].includes(parsed.operator)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function initialize(root: HTMLElement): void {
  const form = requiredElement<HTMLFormElement>(root, "[data-public-form]");
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>("[data-form-step]")];
  const progress = requiredElement<HTMLElement>(root, "[data-form-progress]");
  const progressBar = requiredElement<HTMLElement>(root, "[data-form-progress-bar]");
  const progressLabel = requiredElement<HTMLElement>(root, "[data-form-progress-label]");
  const navigation = requiredElement<HTMLElement>(root, "[data-form-navigation]");
  const back = requiredElement<HTMLButtonElement>(root, "[data-form-back]");
  const next = requiredElement<HTMLButtonElement>(root, "[data-form-next]");
  const review = requiredElement<HTMLElement>(root, "[data-form-review]");
  const reviewList = requiredElement<HTMLDListElement>(root, "[data-form-review-list]");
  const edit = requiredElement<HTMLButtonElement>(root, "[data-form-edit]");
  const submit = requiredElement<HTMLButtonElement>(root, "[data-form-submit]");
  const summary = requiredElement<HTMLElement>(root, "[data-form-error-summary]");
  const errorList = requiredElement<HTMLUListElement>(root, "[data-form-error-list]");
  const success = requiredElement<HTMLElement>(root, "[data-form-success]");
  const receipt = requiredElement<HTMLElement>(root, "[data-form-receipt]");
  const status = requiredElement<HTMLElement>(root, "[data-form-status]");
  let currentStep = 0;
  let idempotencyKey: string | undefined;

  const copy = {
    step: root.dataset.copyStep ?? "Step",
    of: root.dataset.copyOf ?? "of",
    required: root.dataset.copyRequired ?? "This field is required.",
    invalid: root.dataset.copyInvalid ?? "Review this field.",
    sending: root.dataset.copySending ?? "Sending...",
    unavailable: root.dataset.copyUnavailable ?? "Please try again later.",
  };

  function announce(message: string): void {
    status.textContent = "";
    window.requestAnimationFrame(() => {
      status.textContent = message;
    });
  }

  function updateConditionalFields(): void {
    for (const wrapper of form.querySelectorAll<HTMLElement>("[data-form-field][data-condition]")) {
      const condition = parseCondition(wrapper.dataset.condition ?? "");
      const visible = condition ? evaluate(condition, form) : false;
      wrapper.hidden = !visible;
      wrapper.setAttribute("aria-hidden", visible ? "false" : "true");
      for (const control of wrapper.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea")) {
        control.disabled = !visible;
      }
    }
  }

  function showStep(index: number): void {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    review.hidden = true;
    navigation.hidden = false;
    steps.forEach((step, stepIndex) => {
      step.hidden = stepIndex !== currentStep;
    });
    back.hidden = currentStep === 0;
    const position = currentStep + 1;
    progress.setAttribute("aria-valuenow", String(position));
    progressLabel.textContent = `${copy.step} ${position} ${copy.of} ${steps.length}`;
    progressBar.style.setProperty("--form-progress", `${(position / steps.length) * 100}%`);
    summary.hidden = true;
    updateConditionalFields();
    steps[currentStep]
      ?.querySelector<HTMLElement>("legend, label, input, select, textarea")
      ?.focus();
  }

  function clearErrors(scope: ParentNode): void {
    for (const message of scope.querySelectorAll<HTMLElement>("[data-field-error]"))
      message.textContent = "";
    for (const control of scope.querySelectorAll<HTMLElement>("[aria-invalid='true']"))
      control.removeAttribute("aria-invalid");
  }

  function validateStep(step: HTMLFieldSetElement): boolean {
    clearErrors(step);
    errorList.replaceChildren();
    const invalidControls = [
      ...step.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      ),
    ].filter((control) => !control.disabled && !control.checkValidity());
    for (const control of invalidControls) {
      control.setAttribute("aria-invalid", "true");
      const message = control.validity.valueMissing ? copy.required : copy.invalid;
      const error = control
        .closest<HTMLElement>("[data-form-field], [data-form-consent]")
        ?.querySelector<HTMLElement>("[data-field-error]");
      if (error) error.textContent = message;
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      const label = control
        .closest<HTMLElement>("[data-form-field], [data-form-consent]")
        ?.querySelector("label, legend")
        ?.textContent?.trim();
      button.textContent = `${label ?? control.name}: ${message}`;
      button.addEventListener("click", () => control.focus());
      item.append(button);
      errorList.append(item);
    }
    summary.hidden = invalidControls.length === 0;
    if (invalidControls.length > 0) summary.focus();
    return invalidControls.length === 0;
  }

  function answerLabel(wrapper: HTMLElement): string {
    return wrapper.querySelector("label, legend")?.textContent?.replace("*", "").trim() ?? "";
  }

  function answerDisplay(wrapper: HTMLElement): string {
    const fieldCode = wrapper.dataset.formField;
    if (!fieldCode) return "";
    const controls = form.elements.namedItem(fieldCode);
    if (controls instanceof RadioNodeList) {
      const checked = wrapper.querySelector<HTMLInputElement>("input:checked");
      return checked?.closest("label")?.textContent?.trim() ?? "";
    }
    if (controls instanceof HTMLInputElement && controls.type === "checkbox") {
      return controls.checked ? "✓" : "";
    }
    if (controls instanceof HTMLSelectElement)
      return controls.selectedOptions[0]?.textContent?.trim() ?? "";
    if (controls instanceof HTMLInputElement || controls instanceof HTMLTextAreaElement)
      return controls.value;
    return "";
  }

  function renderReview(): void {
    reviewList.replaceChildren();
    updateConditionalFields();
    for (const wrapper of form.querySelectorAll<HTMLElement>("[data-form-field]:not([hidden])")) {
      const term = document.createElement("dt");
      const value = document.createElement("dd");
      term.textContent = answerLabel(wrapper);
      value.textContent = answerDisplay(wrapper) || "--";
      reviewList.append(term, value);
    }
    for (const consent of form.querySelectorAll<HTMLElement>("[data-form-consent]")) {
      const input = requiredElement<HTMLInputElement>(consent, "input[type='checkbox']");
      const term = document.createElement("dt");
      const value = document.createElement("dd");
      term.textContent = consent.querySelector("label")?.textContent?.trim() ?? "";
      value.textContent = input.checked ? "✓" : "--";
      reviewList.append(term, value);
    }
    steps.forEach((step) => {
      step.hidden = true;
    });
    navigation.hidden = true;
    review.hidden = false;
    progress.setAttribute("aria-valuenow", String(steps.length));
    progressBar.style.setProperty("--form-progress", "100%");
    requiredElement<HTMLElement>(review, "h2").focus();
  }

  function collectAnswers(): Record<string, Answer> {
    const answers: Record<string, Answer> = Object.create(null);
    for (const wrapper of form.querySelectorAll<HTMLElement>("[data-form-field]:not([hidden])")) {
      const fieldCode = wrapper.dataset.formField;
      if (!fieldCode) continue;
      const value = conditionValue(form, fieldCode);
      if (value !== undefined && (typeof value !== "string" || value.trim().length > 0))
        answers[fieldCode] = value;
    }
    return answers;
  }

  function collectConsents(): Record<string, boolean> {
    const consents: Record<string, boolean> = Object.create(null);
    for (const wrapper of form.querySelectorAll<HTMLElement>("[data-form-consent]")) {
      const consentType = wrapper.dataset.formConsent;
      const input = wrapper.querySelector<HTMLInputElement>("input[type='checkbox']");
      if (consentType && input) consents[consentType] = input.checked;
    }
    return consents;
  }

  async function send(): Promise<void> {
    submit.disabled = true;
    announce(copy.sending);
    try {
      const bootstrap = await fetch("/api/public/forms/bootstrap", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formCode: root.dataset.formCode,
          formVersion: root.dataset.formVersion,
          locale: root.dataset.formLocale,
          purpose: root.dataset.formPurpose,
        }),
      });
      if (!bootstrap.ok) throw new Error("bootstrap unavailable");
      const grant = (await bootstrap.json()) as { nonce: string; csrfToken: string };
      idempotencyKey ??= `idem_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
      const honeypot = requiredElement<HTMLInputElement>(form, "[name='company_website']").value;
      const response = await fetch("/api/public/forms/submit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-atlas-csrf": grant.csrfToken },
        body: JSON.stringify({
          formCode: root.dataset.formCode,
          formVersion: root.dataset.formVersion,
          locale: root.dataset.formLocale,
          nonce: grant.nonce,
          idempotencyKey,
          answers: collectAnswers(),
          consents: collectConsents(),
          attribution: { landingPage: window.location.pathname },
          honeypot,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; receiptId?: string };
      if (!response.ok || !result.ok) throw new Error("submission unavailable");
      form.hidden = true;
      review.hidden = true;
      success.hidden = false;
      receipt.textContent = result.receiptId ?? "";
      success.focus();
      announce(success.querySelector("h2")?.textContent ?? "");
    } catch {
      announce(copy.unavailable);
      summary.hidden = false;
      errorList.replaceChildren();
      const item = document.createElement("li");
      item.textContent = copy.unavailable;
      errorList.append(item);
      summary.focus();
    } finally {
      submit.disabled = false;
    }
  }

  form.addEventListener("input", updateConditionalFields);
  form.addEventListener("change", updateConditionalFields);
  back.addEventListener("click", () => showStep(currentStep - 1));
  next.addEventListener("click", () => {
    const active = steps[currentStep];
    if (!active || !validateStep(active)) return;
    if (currentStep === steps.length - 1) renderReview();
    else showStep(currentStep + 1);
  });
  edit.addEventListener("click", () => showStep(0));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void send();
  });

  updateConditionalFields();
}

for (const root of document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)) initialize(root);
