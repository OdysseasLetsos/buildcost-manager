"use client";

import { useMemo, useState } from "react";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { InvoiceDocumentListItem, InvoiceSummary } from "../types";
import { AiInvoiceSummaryCards } from "./AiInvoiceSummaryCards";
import { InvoiceAnalysisSteps } from "./InvoiceAnalysisSteps";
import { InvoiceDocumentsTable } from "./InvoiceDocumentsTable";
import { InvoiceReviewPreview } from "./InvoiceReviewPreview";
import { InvoiceUploadPanel } from "./InvoiceUploadPanel";
import { RecentInvoiceImports } from "./RecentInvoiceImports";

export function AiInvoicesPanel({
  documents,
  summary,
  monthlyPeriods,
  defaultMonthKey,
}: Readonly<{
  documents: InvoiceDocumentListItem[];
  summary: InvoiceSummary;
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthKey: string;
}>) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    documents[0]?.id ?? null,
  );
  const selectedDocument = useMemo(
    () =>
      documents.find((document) => document.id === selectedDocumentId) ??
      documents[0] ??
      null,
    [documents, selectedDocumentId],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">AI Ανάλυση</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            AI Ανάλυση Τιμολογίων
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ανέβασμα, ανάλυση και έλεγχος τιμολογίων πριν την καταχώρηση.
          </p>
        </div>
        <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
          Mock ανάλυση Phase 1
        </div>
      </div>

      <AiInvoiceSummaryCards summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <InvoiceAnalysisSteps />
          <InvoiceDocumentsTable
            documents={documents}
            selectedDocumentId={selectedDocument?.id ?? null}
            onSelectDocument={setSelectedDocumentId}
          />
          <InvoiceReviewPreview document={selectedDocument} />
        </div>
        <div className="space-y-6">
          <InvoiceUploadPanel
            monthlyPeriods={monthlyPeriods}
            defaultMonthKey={defaultMonthKey}
          />
          <RecentInvoiceImports documents={documents} />
        </div>
      </div>
    </section>
  );
}
