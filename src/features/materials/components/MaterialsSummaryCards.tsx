import type { MaterialsSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function MaterialsSummaryCards({
  summary,
}: Readonly<{
  summary: MaterialsSummary;
}>) {
  const cards = [
    ["Σύνολο Υλικών", currencyFormatter.format(summary.totalAmount)],
    ["Τιμολόγια Μήνα", String(summary.invoiceCount)],
    ["Πληρωμένα", currencyFormatter.format(summary.paidAmount)],
    ["Εκκρεμή", currencyFormatter.format(summary.pendingAmount)],
    ["Κορυφαίος Προμηθευτής", summary.topSupplier ?? "-"],
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, value]) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
        </article>
      ))}
    </section>
  );
}
