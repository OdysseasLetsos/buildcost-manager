"use client";

import { useTranslation } from "@/src/shared/i18n";
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
  const { t } = useTranslation();
  const cards = [
    [t("projectSummary.revenue"), currencyFormatter.format(totals.invoicedRevenue)],
    [t("projectSummary.totalCost"), currencyFormatter.format(totals.totalCost)],
    [t("projectSummary.profitLoss"), currencyFormatter.format(totals.profit)],
    [
      t("projectSummary.margin"),
      totals.margin === null ? "-" : percentFormatter.format(totals.margin),
    ],
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
