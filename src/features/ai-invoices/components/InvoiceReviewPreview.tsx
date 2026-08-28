import type { InvoiceDocumentListItem } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const targetTypeLabels: Record<string, string> = {
  material: "Υλικό",
  expense: "Έξοδο",
  revenue: "Έσοδο",
  unknown: "Άγνωστο",
};

function Field({
  label,
  value,
}: Readonly<{
  label: string;
  value: string | number | null | undefined;
}>) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">
        {value ?? "-"}
      </dd>
    </div>
  );
}

function formatAmount(value: number | null): string {
  return value == null ? "-" : currencyFormatter.format(value);
}

export function InvoiceReviewPreview({
  document,
}: Readonly<{
  document: InvoiceDocumentListItem | null;
}>) {
  const extracted = document?.extractedInvoice;
  const warnings = Array.isArray(extracted?.warnings)
    ? extracted.warnings.filter((warning): warning is string => typeof warning === "string")
    : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        Προεπισκόπηση ανάλυσης
      </h3>
      {!document ? (
        <p className="mt-3 text-sm text-slate-600">
          Επιλέξτε ένα τιμολόγιο για να δείτε τα στοιχεία ανάλυσης.
        </p>
      ) : !extracted ? (
        <p className="mt-3 text-sm text-slate-600">
          Το τιμολόγιο δεν έχει αναλυθεί ακόμα.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Προμηθευτής" value={extracted.supplier_name} />
            <Field label="ΑΦΜ προμηθευτή" value={extracted.supplier_vat} />
            <Field label="Αριθμός τιμολογίου" value={extracted.invoice_number} />
            <Field label="Ημερομηνία τιμολογίου" value={extracted.invoice_date} />
            <Field label="Καθαρή αξία" value={formatAmount(extracted.net_amount)} />
            <Field label="ΦΠΑ" value={formatAmount(extracted.vat_amount)} />
            <Field label="Σύνολο" value={formatAmount(extracted.total_amount)} />
            <Field label="Νόμισμα" value={extracted.currency} />
            <Field
              label="Προτεινόμενος τύπος"
              value={targetTypeLabels[extracted.target_type_suggestion]}
            />
            <Field label="Κατηγορία" value={extracted.category_suggestion} />
            <Field
              label="Βαθμός εμπιστοσύνης"
              value={`${Math.round((extracted.confidence_score ?? 0) * 100)}%`}
            />
          </dl>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-950">
              Προειδοποιήσεις
            </h4>
            {warnings.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-amber-900">
                Δεν υπάρχουν προειδοποιήσεις.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Δεν δημιουργείται καταχώρηση σε υλικά, έξοδα ή έσοδα σε αυτή τη φάση.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
              title="Θα ενεργοποιηθεί στη Φάση 2"
            >
              Έγκριση
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
              title="Θα ενεργοποιηθεί στη Φάση 2"
            >
              Απόρριψη
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Η έγκριση και η απόρριψη θα ενεργοποιηθούν στη Φάση 2.
          </p>
        </div>
      )}
    </section>
  );
}
