import type { ExpensesSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function ExpensesSummaryCards({
  summary,
}: Readonly<{
  summary: ExpensesSummary;
}>) {
  const cards = [
    ["Γενικά Έξοδα", currencyFormatter.format(summary.generalAmount)],
    ["Έξοδα Έδρας", currencyFormatter.format(summary.officeAmount)],
    ["Σύνολο Μήνα", currencyFormatter.format(summary.totalAmount)],
    ["Προς Κατανομή", currencyFormatter.format(summary.pendingAmount)],
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <article
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
        </article>
      ))}
    </section>
  );
}
