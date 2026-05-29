import type { RevenuesSummary } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function RevenuesSummaryCards({
  summary,
}: Readonly<{
  summary: RevenuesSummary;
}>) {
  const cards = [
    ["Τιμολογηθέντα", currencyFormatter.format(summary.invoicedAmount)],
    ["Εισπραχθέντα", currencyFormatter.format(summary.receivedAmount)],
    ["Υπόλοιπα Πελατών", currencyFormatter.format(summary.remainingAmount)],
    ["Σύνολο Εσόδων", currencyFormatter.format(summary.totalRevenue)],
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
