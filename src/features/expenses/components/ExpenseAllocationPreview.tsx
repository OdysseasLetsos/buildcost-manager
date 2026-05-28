import type { ExpenseAllocationPreview as ExpenseAllocationPreviewData } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 1,
});

export function ExpenseAllocationPreview({
  preview,
}: Readonly<{
  preview: ExpenseAllocationPreviewData;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Προεπισκόπηση Κατανομής</h3>
      <p className="mt-2 text-sm text-slate-600">
        Η κατανομή είναι προεπισκόπηση και δεν αποθηκεύεται ακόμα ως οριστική.
      </p>

      <div className="mt-5 space-y-4">
        {preview.projectTotals.map((item) => (
          <article key={item.projectId} className="space-y-2">
            <div className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-950">
                  {item.projectCode} - {item.projectName}
                </p>
                <p className="text-slate-500">
                  {numberFormatter.format(item.percentage)}%
                </p>
              </div>
              <p className="font-semibold text-slate-950">
                {currencyFormatter.format(item.allocatedAmount)}
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-blue-900"
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
              />
            </div>
          </article>
        ))}
        {preview.projectTotals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Δεν υπάρχει διαθέσιμη κατανομή για τον επιλεγμένο μήνα.
          </p>
        ) : null}
      </div>

      {preview.warnings.length > 0 ? (
        <div className="mt-5 space-y-2">
          {preview.warnings.map((warning) => (
            <p
              key={`${warning.expenseId ?? warning.description}-${warning.message}`}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <span className="font-semibold">{warning.description}</span>:{" "}
              {warning.message}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
