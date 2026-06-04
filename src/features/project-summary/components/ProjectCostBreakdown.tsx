"use client";

import { useTranslation } from "@/src/shared/i18n";
import type { ProjectSummaryCostBreakdown } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function ProjectCostBreakdown({
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        {t("projectSummary.costBreakdown")}
      </h3>
      <div className="mt-5 grid gap-3">
        {items.map(([label, amount]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
          >
            <span className="font-medium text-slate-600">{label}</span>
            <span className="font-semibold text-slate-950">
              {currencyFormatter.format(Number(amount))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
