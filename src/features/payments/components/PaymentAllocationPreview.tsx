import type { PaymentAllocationPreview as PaymentAllocationPreviewData } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 2,
});

export function PaymentAllocationPreview({
  preview,
}: Readonly<{
  preview: PaymentAllocationPreviewData;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        Κατανομή Πληρωμών ανά Έργο
      </h3>
      <div className="mt-4 space-y-3">
        {preview.projectTotals.map((project) => (
          <div key={project.projectId} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">
                  {project.projectCode} - {project.projectName}
                </p>
                <p className="text-sm text-slate-500">
                  {numberFormatter.format(project.workUnits)} μονάδες εργασίας · {numberFormatter.format(project.percentage)}%
                </p>
              </div>
              <p className="font-semibold text-slate-950">
                {currencyFormatter.format(project.allocatedAmount)}
              </p>
            </div>
          </div>
        ))}
        {preview.projectTotals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Δεν υπάρχουν δεδομένα για κατανομή πληρωμών.
          </p>
        ) : null}
      </div>
      {preview.warnings.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Προειδοποιήσεις</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {preview.warnings.map((warning) => (
              <li key={warning.employeeId}>
                {warning.employeeName}: {warning.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
