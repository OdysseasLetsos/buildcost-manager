import type { DashboardFinancials } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const percentFormatter = new Intl.NumberFormat("el-GR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function DashboardFinancialMiniStats({
  financials,
}: Readonly<{
  financials: DashboardFinancials | null;
}>) {
  const projectCount = Math.max(financials?.projects.length ?? 0, 1);
  const stats = [
    ["Μέσος Όρος Εσόδων", currencyFormatter.format((financials?.invoicedRevenue ?? 0) / projectCount)],
    ["Μέσος Όρος Κόστους", currencyFormatter.format((financials?.totalCost ?? 0) / projectCount)],
    ["Μέσο Περιθώριο Κέρδους", financials?.margin === null || financials?.margin === undefined ? "-" : percentFormatter.format(financials.margin)],
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {stats.map(([label, value]) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
        </article>
      ))}
    </section>
  );
}
