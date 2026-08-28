import type { InvoiceDocumentListItem } from "../types";

const documentStatusLabels: Record<string, string> = {
  uploaded: "Ανέβηκε",
  extracting: "Σε ανάλυση",
  review: "Σε έλεγχο",
  rejected: "Απορρίφθηκε",
  completed: "Ολοκληρώθηκε",
  failed: "Αποτυχία",
};

export function RecentInvoiceImports({
  documents,
}: Readonly<{
  documents: InvoiceDocumentListItem[];
}>) {
  const recentDocuments = documents.slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">
        Πρόσφατες εισαγωγές
      </h3>
      <div className="mt-4 space-y-3">
        {recentDocuments.map((document) => (
          <div
            key={document.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {document.original_file_name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(document.created_at).toLocaleDateString("el-GR")}
              </p>
            </div>
            <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {documentStatusLabels[document.status] ?? document.status}
            </span>
          </div>
        ))}
        {recentDocuments.length === 0 ? (
          <p className="text-sm text-slate-500">Δεν υπάρχουν πρόσφατες εισαγωγές.</p>
        ) : null}
      </div>
    </section>
  );
}
