"use client";

import { useState } from "react";
import { deleteProjectQuote } from "../actions/delete-project-quote";
import { calculateProjectQuoteTotals } from "../services/calculate-project-quote-totals";
import type {
  ProjectStatus,
  ProjectQuote,
  ProjectQuoteStatus,
  ProjectQuoteType,
} from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const statusLabels: Record<ProjectQuoteStatus, string> = {
  draft: "Πρόχειρη",
  sent: "Απεσταλμένη",
  pending_approval: "Σε αναμονή",
  approved: "Εγκρίθηκε",
  rejected: "Απορρίφθηκε",
  cancelled: "Ακυρώθηκε",
  revised: "Αναθεωρήθηκε",
};

const statusClassNames: Record<ProjectQuoteStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  sent: "border-blue-200 bg-blue-50 text-blue-800",
  pending_approval: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  revised: "border-violet-200 bg-violet-50 text-violet-800",
};

const typeLabels: Record<ProjectQuoteType, string> = {
  initial: "Αρχική προσφορά",
  supplemental: "Νέα προσφορά",
};

function getQuoteTypeLabel(value: ProjectQuote["quote_type"]): string {
  return value === "initial" ? typeLabels.initial : typeLabels.supplemental;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("el-GR");
}

export function ProjectQuotesHistory({
  quotes,
  initialBudget,
  projectStatus,
  onEdit,
  onDeleted,
}: Readonly<{
  quotes: ProjectQuote[];
  initialBudget: number | null;
  projectStatus: ProjectStatus;
  onEdit: (quote: ProjectQuote) => void;
  onDeleted: (quoteId: string, message: string) => void;
}>) {
  const [quoteToDelete, setQuoteToDelete] = useState<ProjectQuote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const mutationsLocked =
    projectStatus === "completed" || projectStatus === "cancelled";
  const totals = calculateProjectQuoteTotals(initialBudget, quotes);
  const financialItems = [
    {
      label: "Αρχικός προϋπολογισμός",
      value: totals.initialBudget,
      className: "border-slate-200 bg-slate-50 text-slate-900",
    },
    {
      label: "Σύνολο εγκεκριμένων προσφορών",
      value: totals.approvedQuotesTotal,
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Σε αναμονή",
      value: totals.pendingQuotesTotal,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      label: "Πρόχειρες προσφορές",
      value: totals.draftQuotesTotal,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    },
    {
      label: "Απορριφθείσες προσφορές",
      value: totals.rejectedQuotesTotal,
      className: "border-red-200 bg-red-50 text-red-900",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-950">
            Προσφορές Έργου
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Ιστορικό αρχικών και συμπληρωματικών προσφορών.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {financialItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-3 ${item.className}`}
          >
            <p className="text-xs font-medium opacity-75">{item.label}</p>
            <p className="mt-2 text-base font-bold">
              {currencyFormatter.format(item.value)}
            </p>
          </div>
        ))}
      </div>

      {mutationsLocked ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {projectStatus === "completed"
            ? "Το έργο έχει ολοκληρωθεί. Για αλλαγές απαιτείται επανενεργοποίηση ή νέο έργο."
            : "Το ακυρωμένο έργο και οι προσφορές του είναι διαθέσιμα μόνο για προβολή."}
        </p>
      ) : null}

      {message ? (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {quotes.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
          Δεν υπάρχουν αποθηκευμένες προσφορές για αυτό το έργο.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Αριθμός</th>
                <th className="px-3 py-3 font-semibold">Έκδοση</th>
                <th className="px-3 py-3 font-semibold">Τύπος</th>
                <th className="px-3 py-3 font-semibold">Τίτλος</th>
                <th className="px-3 py-3 font-semibold">Σύνολο</th>
                <th className="px-3 py-3 font-semibold">Κατάσταση</th>
                <th className="px-3 py-3 font-semibold">Ημερομηνία</th>
                <th className="px-3 py-3 font-semibold">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <tr key={quote.id} className="align-top">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {quote.quote_number}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {quote.version}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {getQuoteTypeLabel(quote.quote_type)}
                  </td>
                  <td className="max-w-64 px-3 py-3 text-slate-900">
                    <p className="font-medium">{quote.title}</p>
                    {quote.status === "rejected" &&
                    quote.rejection_reason ? (
                      <p className="mt-1 text-xs text-red-700">
                        Λόγος: {quote.rejection_reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {currencyFormatter.format(quote.total_amount)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassNames[quote.status]}`}
                    >
                      {statusLabels[quote.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {formatDate(quote.quote_date)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(quote)}
                        disabled={mutationsLocked}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Επεξεργασία
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null);
                          setQuoteToDelete(quote);
                        }}
                        disabled={
                          mutationsLocked || quote.status === "approved"
                        }
                        title={
                          quote.status === "approved"
                            ? "Η εγκεκριμένη προσφορά δεν μπορεί να διαγραφεί. Μπορεί να ακυρωθεί ή να δημιουργηθεί νέα έκδοση."
                            : undefined
                        }
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Διαγραφή
                      </button>
                    </div>
                    {quote.status === "approved" ? (
                      <p className="mt-2 max-w-64 text-xs leading-5 text-slate-500">
                        Η εγκεκριμένη προσφορά δεν μπορεί να διαγραφεί. Μπορεί
                        να ακυρωθεί ή να δημιουργηθεί νέα έκδοση.
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {quoteToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-quote-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h4
              id="delete-quote-title"
              className="text-base font-bold text-slate-950"
            >
              Διαγραφή προσφοράς
            </h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Θέλετε σίγουρα να διαγράψετε αυτή την προσφορά;
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const result = await deleteProjectQuote(
                      quoteToDelete.id,
                      quoteToDelete.project_id,
                    );
                    setMessage({
                      ok: result.ok,
                      text:
                        result.message ??
                        (result.ok
                          ? "Η προσφορά διαγράφηκε επιτυχώς."
                          : "Δεν ήταν δυνατή η διαγραφή της προσφοράς."),
                    });

                    if (result.ok) {
                      onDeleted(
                        quoteToDelete.id,
                        result.message ?? "Η προσφορά διαγράφηκε επιτυχώς.",
                      );
                      setQuoteToDelete(null);
                    }
                  } catch {
                    setMessage({
                      ok: false,
                      text: "Δεν ήταν δυνατή η διαγραφή της προσφοράς.",
                    });
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
              >
                {isDeleting ? "Διαγραφή..." : "Διαγραφή"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
