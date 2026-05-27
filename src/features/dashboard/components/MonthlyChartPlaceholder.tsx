import type { DashboardMonthlyWorkTotal } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 2,
});

export function MonthlyChartPlaceholder({
  monthlyTotals,
}: Readonly<{
  monthlyTotals: DashboardMonthlyWorkTotal[];
}>) {
  const maxHours = Math.max(
    ...monthlyTotals.map((total) => total.totalHours + total.totalOvertimeHours),
    1,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Μηνιαία Εικόνα Εργασίας
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ώρες, υπερωρίες, έξοδα εργαζομένων και εκτιμώμενο κόστος εργασίας
            από τις ημερήσιες καταχωρήσεις.
          </p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Ημερήσια Εργασία
        </span>
      </div>

      {monthlyTotals.length > 0 ? (
        <div className="mt-8 space-y-4">
          <div className="flex h-52 items-end gap-3 rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4">
            {monthlyTotals.map((total) => {
              const value = total.totalHours + total.totalOvertimeHours;
              const height = Math.max((value / maxHours) * 100, 6);

              return (
                <div
                  key={total.monthKey}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-40 w-full items-end rounded-full bg-blue-100">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-blue-950 to-blue-600"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="truncate text-xs font-semibold text-slate-500">
                    {total.monthKey}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Μήνας</th>
                  <th className="px-4 py-3 font-semibold">Ώρες</th>
                  <th className="px-4 py-3 font-semibold">Υπερωρίες</th>
                  <th className="px-4 py-3 font-semibold">Έξοδα</th>
                  <th className="px-4 py-3 font-semibold">Κόστος</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyTotals.map((total) => (
                  <tr key={total.monthKey}>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {total.monthKey}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {numberFormatter.format(total.totalHours)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {numberFormatter.format(total.totalOvertimeHours)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {currencyFormatter.format(total.totalExpenseAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {currencyFormatter.format(total.estimatedLaborCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Δεν υπάρχουν ακόμα δεδομένα ημερήσιας εργασίας για μηνιαία απεικόνιση.
        </div>
      )}
    </section>
  );
}
