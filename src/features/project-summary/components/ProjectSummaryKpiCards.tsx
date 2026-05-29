import type { ProjectSummaryTotals } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const percentFormatter = new Intl.NumberFormat("el-GR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function ProjectSummaryKpiCards({
  totals,
}: Readonly<{
  totals: ProjectSummaryTotals;
}>) {
  const cards = [
    ["Έσοδα", currencyFormatter.format(totals.invoicedRevenue)],
    ["Συνολικό Κόστος", currencyFormatter.format(totals.totalCost)],
    ["Κέρδος / Ζημιά", currencyFormatter.format(totals.profit)],
    ["Περιθώριο", totals.margin === null ? "-" : percentFormatter.format(totals.margin)],
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
