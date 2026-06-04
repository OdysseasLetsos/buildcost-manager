"use client";

import { useTranslation } from "@/src/shared/i18n";
import type { ProjectSummaryCostBreakdown } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function ProjectCostChart({
  costs,
}: Readonly<{
  costs: ProjectSummaryCostBreakdown;
}>) {
  const { t } = useTranslation();
  const items = [
    [t("projectSummary.payments"), costs.allocatedPayments],
    [t("projectSummary.ika"), costs.allocatedIka],
    [t("projectSummary.materials"), costs.materialsCost],
    [t("projectSummary.employeeExpenses"), costs.employeeExpenses],
    [t("projectSummary.allocatedExpenses"), costs.allocatedExpenses],
  ];
  const maxAmount = Math.max(...items.map(([, amount]) => Number(amount)), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        {t("projectSummary.costDistribution")}
      </h3>
      <div className="mt-5 space-y-4">
        {items.map(([label, amount]) => {
          const numericAmount = Number(amount);
          return (
            <article key={label} className="space-y-2">
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="font-semibold text-slate-950">
                  {currencyFormatter.format(numericAmount)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-900"
                  style={{ width: `${Math.max((numericAmount / maxAmount) * 100, 2)}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
