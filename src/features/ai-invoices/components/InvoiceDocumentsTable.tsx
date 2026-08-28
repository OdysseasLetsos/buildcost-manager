"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runInvoiceExtraction } from "../actions/run-invoice-extraction";
import type { InvoiceDocumentListItem } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const documentStatusLabels: Record<string, string> = {
  uploaded: "Ανέβηκε",
  extracting: "Σε ανάλυση",
  review: "Σε έλεγχο",
  rejected: "Απορρίφθηκε",
  completed: "Ολοκληρώθηκε",
  failed: "Αποτυχία",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("el-GR");
}

function formatAmount(value: number | null): string {
  return value == null ? "-" : currencyFormatter.format(value);
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const tone =
    status === "review"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : status === "completed"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : status === "failed" || status === "rejected"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {documentStatusLabels[status] ?? status}
    </span>
  );
}

export function InvoiceDocumentsTable({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: Readonly<{
  documents: InvoiceDocumentListItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
}>) {
  const router = useRouter();
  const [messageByDocument, setMessageByDocument] = useState<Record<string, string>>(
    {},
  );
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            Τιμολόγια προς έλεγχο
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Τα αρχεία μένουν σε έλεγχο και δεν καταχωρούνται αυτόματα.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Αρχείο</th>
              <th className="px-4 py-3">Ημερομηνία upload</th>
              <th className="px-4 py-3">Κατάσταση</th>
              <th className="px-4 py-3">Προμηθευτής</th>
              <th className="px-4 py-3">Αριθμός τιμολογίου</th>
              <th className="px-4 py-3 text-right">Σύνολο</th>
              <th className="px-4 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((document) => (
              <tr
                key={document.id}
                className={
                  selectedDocumentId === document.id ? "bg-blue-50/40" : undefined
                }
              >
                <td className="px-4 py-4 font-medium text-slate-950">
                  <button
                    type="button"
                    onClick={() => onSelectDocument(document.id)}
                    className="max-w-56 truncate text-left hover:text-blue-700"
                    title={document.original_file_name}
                  >
                    {document.original_file_name}
                  </button>
                  {messageByDocument[document.id] ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {messageByDocument[document.id]}
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                  {formatDate(document.created_at)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={document.status} />
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {document.extractedInvoice?.supplier_name ?? "-"}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {document.extractedInvoice?.invoice_number ?? "-"}
                </td>
                <td className="px-4 py-4 text-right font-semibold text-slate-900">
                  {formatAmount(document.extractedInvoice?.total_amount ?? null)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDocument(document.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Προβολή
                    </button>
                    <button
                      type="button"
                      disabled={
                        isPending ||
                        document.status === "extracting" ||
                        document.status === "review"
                      }
                      onClick={() => {
                        setPendingDocumentId(document.id);
                        startTransition(async () => {
                          const result = await runInvoiceExtraction(document.id);
                          setMessageByDocument((messages) => ({
                            ...messages,
                            [document.id]:
                              result.message ??
                              (result.ok
                                ? "Η ανάλυση ολοκληρώθηκε."
                                : "Δεν ήταν δυνατή η ανάλυση."),
                          }));

                          if (result.ok) {
                            onSelectDocument(document.id);
                            router.refresh();
                          }

                          setPendingDocumentId(null);
                        });
                      }}
                      className="rounded-lg bg-blue-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending && pendingDocumentId === document.id
                        ? "Ανάλυση..."
                        : "AI Ανάλυση"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Δεν υπάρχουν ανεβασμένα τιμολόγια AI ακόμα.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
