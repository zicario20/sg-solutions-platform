"use client";

import { type ClientProfileLocale, clientProfileCopy } from "@atlas/i18n";
import { useEffect, useState } from "react";

const copyFor = (locale: ClientProfileLocale) => clientProfileCopy[locale];
type Goal = Readonly<{
  goalRef: string;
  code: keyof ReturnType<typeof copyFor>["goalOptions"];
  state: keyof ReturnType<typeof copyFor>["state"];
  submittedAt: string;
}>;
type FinancialReceipt = Readonly<{
  dti?: Readonly<{ kind: "available"; ratioBasisPoints: number }>;
}>;
const toMinor = (value: string) => Math.round(Number(value) * 100);
export function ClientProfilePortal({
  locale,
  csrfToken,
}: {
  locale: ClientProfileLocale;
  csrfToken?: string;
}) {
  const copy = clientProfileCopy[locale];
  const [goals, setGoals] = useState<readonly Goal[]>([]);
  const [code, setCode] = useState<Goal["code"]>("credit_organization");
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "submitting">("loading");
  const [homeBuyingFinancialAvailable, setHomeBuyingFinancialAvailable] = useState(false);
  const [income, setIncome] = useState("");
  const [debt, setDebt] = useState("");
  const [financialAccepted, setFinancialAccepted] = useState(false);
  const [financialState, setFinancialState] = useState<"ready" | "submitting">("ready");
  const [financialReceipt, setFinancialReceipt] = useState<FinancialReceipt>();
  useEffect(() => {
    fetch("/api/client/profile", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : Promise.reject()))
      .then((value) => {
        setGoals(value.goals ?? []);
        setHomeBuyingFinancialAvailable(value.homeBuyingFinancialAvailable === true);
        setState("ready");
      })
      .catch(() => setState("unavailable"));
  }, []);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accepted || !csrfToken) return;
    setState("submitting");
    try {
      const response = await fetch("/api/client/profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-atlas-csrf": csrfToken },
        body: JSON.stringify({
          action: "submit_goal",
          goalCode: code,
          noticeVersion: "m015-self-service-v1",
          noticeAccepted: true,
        }),
      });
      if (!response.ok) throw new Error();
      const value = await response.json();
      setGoals(value.goals ?? []);
      setAccepted(false);
      setState("ready");
    } catch {
      setState("unavailable");
    }
  };
  const submitFinancial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const monthlyGrossIncomeMinor = toMinor(income);
    const monthlyRecurringDebtMinor = toMinor(debt);
    if (
      !financialAccepted ||
      !csrfToken ||
      !Number.isSafeInteger(monthlyGrossIncomeMinor) ||
      monthlyGrossIncomeMinor <= 0 ||
      !Number.isSafeInteger(monthlyRecurringDebtMinor) ||
      monthlyRecurringDebtMinor < 0
    )
      return;
    setFinancialState("submitting");
    try {
      const response = await fetch("/api/client/profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-atlas-csrf": csrfToken },
        body: JSON.stringify({
          action: "submit_home_buying_financial_proposal",
          monthlyGrossIncomeMinor,
          monthlyRecurringDebtMinor,
          currency: "USD",
          cadence: "monthly",
          acknowledgementVersion: "m015-home-buying-financial-v1",
          acknowledgementAccepted: true,
        }),
      });
      if (!response.ok) throw new Error();
      setFinancialReceipt(await response.json());
      setFinancialAccepted(false);
    } catch {
      setHomeBuyingFinancialAvailable(false);
    } finally {
      setFinancialState("ready");
    }
  };
  return (
    <section className="profile-portal" aria-labelledby="profile-title">
      <header>
        <p>{copy.eyebrow}</p>
        <h1 id="profile-title">{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <section className="profile-notice" aria-live="polite">
        <h2>{copy.noticeTitle}</h2>
        <p>{copy.notice}</p>
      </section>
      {state === "unavailable" ? (
        <section className="profile-notice" role="status">
          <p>{copy.unavailable}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {copy.retry}
          </button>
        </section>
      ) : null}
      {state !== "unavailable" ? (
        <form className="profile-goal-form" onSubmit={submit}>
          <h2>{copy.goalTitle}</h2>
          <label htmlFor="profile-goal">{copy.goalLabel}</label>
          <select
            id="profile-goal"
            value={code}
            onChange={(event) => setCode(event.target.value as Goal["code"])}
          >
            {Object.entries(copy.goalOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="profile-checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            {copy.noticeLabel}
          </label>
          <button
            className="portal-cta"
            type="submit"
            disabled={!accepted || state === "submitting"}
          >
            {state === "submitting" ? copy.submitting : copy.submit}
          </button>
        </form>
      ) : null}
      <section className="profile-goals" aria-live="polite">
        <h2>{copy.goalsTitle}</h2>
        {goals.length === 0 ? (
          <p>{copy.noGoals}</p>
        ) : (
          <ul>
            {goals.map((goal) => (
              <li key={goal.goalRef}>
                <strong>{copy.goalOptions[goal.code]}</strong>
                <span>{copy.state[goal.state]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="profile-financial" aria-labelledby="profile-financial-title">
        <h2 id="profile-financial-title">{copy.financialTitle}</h2>
        <p>{copy.financialIntro}</p>
        {homeBuyingFinancialAvailable ? (
          <form className="profile-goal-form" onSubmit={submitFinancial}>
            <label htmlFor="profile-income">{copy.incomeLabel}</label>
            <input
              id="profile-income"
              inputMode="decimal"
              min="0.01"
              onChange={(event) => setIncome(event.target.value)}
              required
              step="0.01"
              type="number"
              value={income}
            />
            <label htmlFor="profile-debt">{copy.debtLabel}</label>
            <input
              id="profile-debt"
              inputMode="decimal"
              min="0"
              onChange={(event) => setDebt(event.target.value)}
              required
              step="0.01"
              type="number"
              value={debt}
            />
            <label className="profile-checkbox">
              <input
                checked={financialAccepted}
                onChange={(event) => setFinancialAccepted(event.target.checked)}
                type="checkbox"
              />
              {copy.financialAcknowledgement}
            </label>
            <button
              className="portal-cta"
              disabled={!financialAccepted || financialState === "submitting"}
              type="submit"
            >
              {financialState === "submitting" ? copy.financialSubmitting : copy.financialSubmit}
            </button>
          </form>
        ) : (
          <p className="profile-notice">{copy.financialUnavailable}</p>
        )}
        {financialReceipt?.dti?.kind === "available" ? (
          <p>
            {copy.dtiLabel}: {(financialReceipt.dti.ratioBasisPoints / 100).toFixed(2)}%
          </p>
        ) : null}
      </section>
      <section aria-label={copy.title}>
        <ul className="profile-steps">
          {copy.sections.map((item, index) => (
            <li key={item}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </section>
      <aside className="profile-safety">
        <h2>{copy.avoidTitle}</h2>
        <p>{copy.avoid}</p>
      </aside>
      <footer>
        <a className="portal-cta" href="/client/help">
          {copy.support}
        </a>
        <a href="/client/settings/account">{copy.back}</a>
      </footer>
    </section>
  );
}
