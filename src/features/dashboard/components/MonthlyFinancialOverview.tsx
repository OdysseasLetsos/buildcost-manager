import type { DashboardMonthlyFinancialTotal } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const percentFormatter = new Intl.NumberFormat("el-GR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function MonthlyFinancialOverview({
  monthlyTotals,
}: Readonly<{
  monthlyTotals: DashboardMonthlyFinancialTotal[];
}>) {
  const maxValue = Math.max(
    ...monthlyTotals.map((month) => Math.max(month.revenue, month.cost, Math.abs(month.profit))),
    1,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">Μηνιαία Εξέλιξη</h2>
      <p className="mt-2 text-sm text-slate-500">Πραγματικά έσοδα, κόστος, κέρδος και περιθώριο από Project Summary.</p>
      {monthlyTotals.length > 0 ? (
        <div className="mt-5 space-y-4">
          {monthlyTotals.map((month) => (
            <article key={month.monthId} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-slate-950">{month.monthKey}</p>
                <p className="text-slate-600">
                  Περιθώριο: {month.margin === null ? "-" : percentFormatter.format(month.margin)}
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  ["Έσοδα", month.revenue, "bg-emerald-600"],
                  ["Κόστος", month.cost, "bg-amber-500"],
                  ["Κέρδος", month.profit, month.profit < 0 ? "bg-red-500" : "bg-blue-700"],
                ].map(([label, amount, color]) => (
                  <div key={label} className="grid grid-cols-[90px_1fr_110px] items-center gap-3 text-xs">
                    <span className="font-medium text-slate-600">{label}</span>
                    <div className="h-2 rounded-full bg-white">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${Math.max((Math.abs(Number(amount)) / maxValue) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="text-right font-semibold text-slate-900">{currencyFormatter.format(Number(amount))}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Δεν υπάρχουν οικονομικά δεδομένα για μηνιαία απεικόνιση.
        </p>
      )}
    </section>
  );
}
