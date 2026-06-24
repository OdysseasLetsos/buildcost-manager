"use client";

import { useState } from "react";
import { createProjectQuote } from "../actions/create-project-quote";
import { updateProjectQuote } from "../actions/update-project-quote";
import type {
  ProjectQuote,
  ProjectQuoteActionState,
  ProjectQuoteStatus,
} from "../types";

type ConnectedProject = {
  id: string;
  code: string;
  name: string;
  clientName: string;
  location: string;
};

const quoteSteps = [
  { value: "draft", label: "Πρόχειρη" },
  { value: "sent", label: "Απεσταλμένη" },
  { value: "pending_approval", label: "Σε αναμονή" },
  { value: "approved", label: "Εγκρίθηκε" },
  { value: "rejected", label: "Απορρίφθηκε" },
] as const;

const quoteStatuses: { value: ProjectQuoteStatus; label: string }[] = [
  ...quoteSteps,
  { value: "cancelled", label: "Ακυρώθηκε" },
  { value: "revised", label: "Αναθεωρήθηκε" },
];

const initialState: ProjectQuoteActionState = { ok: false };

function localDateValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function ReadOnlyValue({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
        {value.trim() || "—"}
      </dd>
    </div>
  );
}

const quoteInputClassName =
  "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function ProjectQuoteDraftCard({
  project,
  quote,
  onSaved,
  onClose,
}: Readonly<{
  project: ConnectedProject;
  quote?: ProjectQuote;
  onSaved: (quote: ProjectQuote) => void;
  onClose: () => void;
}>) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [state, setState] = useState<ProjectQuoteActionState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(quote?.title ?? "");
  const [amount, setAmount] = useState(
    quote ? String(quote.amount) : "",
  );
  const [vatAmount, setVatAmount] = useState(
    quote ? String(quote.vat_amount) : "0",
  );
  const [totalAmount, setTotalAmount] = useState(
    quote ? String(quote.total_amount) : "",
  );
  const [description, setDescription] = useState(quote?.description ?? "");
  const [quoteDate, setQuoteDate] = useState(
    quote?.quote_date ?? localDateValue,
  );
  const [quoteStatus, setQuoteStatus] =
    useState<ProjectQuoteStatus>(quote?.status ?? "draft");
  const [rejectionReason, setRejectionReason] = useState(
    quote?.rejection_reason ?? "",
  );
  const isEditing = Boolean(quote);
  const approvedAmountsLocked = quote?.status === "approved";

  function updateCalculatedTotal(nextAmount: string, nextVat: string) {
    const net = Number(nextAmount);
    const vat = Number(nextVat);

    if (Number.isFinite(net) && Number.isFinite(vat)) {
      setTotalAmount((net + vat).toFixed(2));
    }
  }

  async function handleSave(statusOverride?: ProjectQuoteStatus) {
    const statusToSave = statusOverride ?? quoteStatus;
    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("title", title);
    formData.set("amount", amount);
    formData.set("vatAmount", vatAmount);
    formData.set("totalAmount", totalAmount);
    formData.set("description", description);
    formData.set("quoteDate", quoteDate);
    formData.set("status", statusToSave);
    formData.set("rejectionReason", rejectionReason);
    if (quote) {
      formData.set("quoteId", quote.id);
    }

    setIsSaving(true);

    try {
      const result = quote
        ? await updateProjectQuote(formData)
        : await createProjectQuote(formData);
      setState(result);

      if (result.ok && result.quote) {
        onSaved(result.quote);

        if (!quote) {
          setTitle("");
          setAmount("");
          setVatAmount("0");
          setTotalAmount("");
          setDescription("");
          setQuoteDate(localDateValue());
          setQuoteStatus("draft");
          setRejectionReason("");
        }
      }
    } catch {
      setState({
        ok: false,
        message: quote
          ? "Δεν ήταν δυνατή η ενημέρωση της προσφοράς."
          : "Δεν ήταν δυνατή η αποθήκευση της προσφοράς.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-blue-950">
            {isEditing
              ? "Επεξεργασία Προσφοράς"
              : "Νέα Προσφορά για το ίδιο έργο"}
          </h3>
          <span className="rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-bold text-white">
            {isEditing ? "ΕΠΕΞ." : "ΝΕΑ"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
          >
            {isExpanded ? "Σύμπτυξη" : "Άνοιγμα"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Κλείσιμο
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="grid gap-6 p-5">
          <ol
            aria-label="Κατάσταση προσφοράς"
            className="grid gap-2 sm:grid-cols-5"
          >
            {quoteSteps.map((step, index) => {
              const isCurrent = step.value === quoteStatus;

              return (
                <li
                  key={step.value}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 ${
                    isCurrent
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-white text-blue-800"
                        : "bg-white text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-xs font-semibold">
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <h4 className="text-sm font-bold text-slate-900">
              Συνδεδεμένο Έργο (μόνο ανάγνωση)
            </h4>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReadOnlyValue label="Κωδικός" value={project.code} />
              <ReadOnlyValue label="Όνομα Έργου" value={project.name} />
              <ReadOnlyValue label="Πελάτης" value={project.clientName} />
              <ReadOnlyValue label="Τοποθεσία" value={project.location} />
            </dl>
          </div>

          {state.message ? (
            <p
              className={`rounded-lg border px-4 py-3 text-sm ${
                state.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Τίτλος Προσφοράς *
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="π.χ. Συμπληρωματικές εργασίες"
                className={quoteInputClassName}
              />
              {state.fieldErrors?.title ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.title}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Ποσό Προσφοράς *
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                disabled={approvedAmountsLocked}
                onChange={(event) => {
                  const nextAmount = event.target.value;
                  setAmount(nextAmount);
                  updateCalculatedTotal(nextAmount, vatAmount);
                }}
                placeholder="0,00"
                className={quoteInputClassName}
              />
              {state.fieldErrors?.amount ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.amount}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              ΦΠΑ
              <input
                type="number"
                min="0"
                step="0.01"
                value={vatAmount}
                disabled={approvedAmountsLocked}
                onChange={(event) => {
                  const nextVat = event.target.value;
                  setVatAmount(nextVat);
                  updateCalculatedTotal(amount, nextVat);
                }}
                className={quoteInputClassName}
              />
              {state.fieldErrors?.vatAmount ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.vatAmount}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Συνολικό ποσό *
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                disabled={approvedAmountsLocked}
                onChange={(event) => setTotalAmount(event.target.value)}
                className={quoteInputClassName}
              />
              {state.fieldErrors?.totalAmount ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.totalAmount}
                </span>
              ) : null}
            </label>

            {approvedAmountsLocked ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 md:col-span-2">
                Τα ποσά της εγκεκριμένης προσφοράς είναι κλειδωμένα. Για αλλαγή
                ποσού δημιουργήστε νέα έκδοση ή αναθεώρηση.
              </p>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Περιγραφή Εργασιών *
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Περιγράψτε τις εργασίες που περιλαμβάνει η προσφορά."
                className={quoteInputClassName}
              />
              {state.fieldErrors?.description ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.description}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Ημερομηνία Προσφοράς *
              <input
                type="date"
                value={quoteDate}
                onChange={(event) => setQuoteDate(event.target.value)}
                className={quoteInputClassName}
              />
              {state.fieldErrors?.quoteDate ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.quoteDate}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Κατάσταση Προσφοράς *
              <select
                value={quoteStatus}
                onChange={(event) =>
                  setQuoteStatus(event.target.value as ProjectQuoteStatus)
                }
                className={quoteInputClassName}
              >
                {quoteStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            {quoteStatus === "rejected" ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Λόγος απόρριψης *
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Καταγράψτε τον λόγο απόρριψης της προσφοράς."
                  className={quoteInputClassName}
                />
                {state.fieldErrors?.rejectionReason ? (
                  <span className="text-xs text-red-700">
                    {state.fieldErrors.rejectionReason}
                  </span>
                ) : null}
              </label>
            ) : null}
          </div>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSaving
                ? "Αποθήκευση..."
                : isEditing
                  ? "Αποθήκευση αλλαγών"
                  : quoteStatus === "draft"
                    ? "Αποθήκευση πρόχειρης"
                    : "Αποθήκευση προσφοράς"}
            </button>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setQuoteStatus("sent");
                  void handleSave("sent");
                }}
                disabled={isSaving}
                className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSaving ? "Αποθήκευση..." : "Αποστολή στον πελάτη"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
