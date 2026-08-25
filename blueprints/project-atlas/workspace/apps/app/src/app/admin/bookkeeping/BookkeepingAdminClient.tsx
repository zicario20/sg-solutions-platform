"use client";

import { useEffect, useState } from "react";

type Book = Readonly<{
  bookRef: string;
  accountingEntityRef: string;
  accountingBasis: string;
  status: string;
}>;
type TrialBalance = Readonly<{
  kind: string;
  items?: readonly Readonly<{
    accountRef: string;
    code: string;
    name: string;
    debitMinor: number;
    creditMinor: number;
  }>[];
}>;

export function BookkeepingAdminClient({ locale }: { locale: "es" | "en" }) {
  const [books, setBooks] = useState<readonly Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>();
  const [trialBalance, setTrialBalance] = useState<TrialBalance>();
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    void fetch("/api/admin/bookkeeping", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { items?: readonly Book[] }) => {
        const items = payload.items ?? [];
        setBooks(items);
        setSelectedBook(items[0]?.bookRef);
        setState("ready");
      })
      .catch(() => setState("unavailable"));
  }, []);
  useEffect(() => {
    if (!selectedBook) return;
    void fetch(`/api/admin/bookkeeping?bookRef=${encodeURIComponent(selectedBook)}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: TrialBalance) => setTrialBalance(payload))
      .catch(() => setTrialBalance(undefined));
  }, [selectedBook]);
  const currency = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
  });
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
          {locale === "en" ? "Internal finance" : "Finanzas internas"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          {locale === "en" ? "Bookkeeping workspace" : "Espacio de contabilidad"}
        </h1>
        <p className="mt-2 text-slate-600">
          {locale === "en"
            ? "Review authorized books and posted ledger balances."
            : "Revisa libros autorizados y saldos de partidas posteadas."}
        </p>
      </header>
      <section
        className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
        aria-labelledby="bookkeeping-provider-boundary"
      >
        <h2 id="bookkeeping-provider-boundary" className="font-semibold">
          {locale === "en"
            ? "Provider connections are disabled"
            : "Las conexiones de proveedores están deshabilitadas"}
        </h2>
        <p className="mt-2 text-sm text-amber-900">
          {locale === "en"
            ? "This workspace reviews the internal ledger only. It does not connect financial accounts, synchronize external accounting systems, or submit tax filings."
            : "Este espacio revisa únicamente el libro interno. No conecta cuentas financieras, sincroniza sistemas contables externos ni presenta declaraciones fiscales."}
        </p>
      </section>
      {state === "loading" ? (
        <section
          className="grid gap-4 sm:grid-cols-3"
          role="status"
          aria-live="polite"
          aria-label={
            locale === "en" ? "Loading bookkeeping records" : "Cargando registros contables"
          }
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </section>
      ) : null}
      {state === "unavailable" ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
          {locale === "en"
            ? "Bookkeeping data is temporarily unavailable."
            : "Los datos contables no están disponibles temporalmente."}
        </section>
      ) : null}
      {state === "ready" && books.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
          {locale === "en"
            ? "No authorized books are available."
            : "No hay libros autorizados disponibles."}
        </section>
      ) : null}
      {books.length > 0 ? (
        <section className="grid gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">{locale === "en" ? "Books" : "Libros"}</h2>
            <div className="mt-3 space-y-2">
              {books.map((book) => (
                <button
                  type="button"
                  key={book.bookRef}
                  onClick={() => setSelectedBook(book.bookRef)}
                  aria-pressed={selectedBook === book.bookRef}
                  className={`w-full rounded-2xl p-3 text-left text-sm ${selectedBook === book.bookRef ? "bg-sky-700 text-white" : "bg-slate-50 text-slate-800"}`}
                >
                  <span className="block font-semibold">{book.accountingEntityRef}</span>
                  <span className="block capitalize opacity-80">
                    {book.status} · {book.accountingBasis}
                  </span>
                </button>
              ))}
            </div>
          </aside>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              {locale === "en" ? "Trial balance" : "Balance de comprobación"}
            </h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <caption className="sr-only">
                  {locale === "en"
                    ? "Trial balance for the selected bookkeeping book"
                    : "Balance de comprobación del libro contable seleccionado"}
                </caption>
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3">{locale === "en" ? "Account" : "Cuenta"}</th>
                    <th className="pb-3 text-right">{locale === "en" ? "Debit" : "Debe"}</th>
                    <th className="pb-3 text-right">{locale === "en" ? "Credit" : "Haber"}</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance?.items?.map((line) => (
                    <tr key={line.accountRef} className="border-b border-slate-100">
                      <td className="py-3">
                        <span className="font-medium text-slate-950">{line.code}</span>{" "}
                        <span className="text-slate-600">{line.name}</span>
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {currency.format(line.debitMinor / 100)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {currency.format(line.creditMinor / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}
