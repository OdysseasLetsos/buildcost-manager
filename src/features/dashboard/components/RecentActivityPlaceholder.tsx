import type { DashboardRecentDailyWorkEntry } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function RecentActivityPlaceholder({
  entries,
}: Readonly<{
  entries: DashboardRecentDailyWorkEntry[];
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">
        Πρόσφατες Κινήσεις
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Τελευταίες καταχωρήσεις ημερήσιας εργασίας για τον επιλεγμένο μήνα.
      </p>

      {entries.length > 0 ? (
        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {entry.employeeName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.projectCode} · {entry.projectName}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-700">
                  {dateFormatter.format(new Date(entry.workDate))}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Ώρες</dt>
                  <dd className="font-semibold text-slate-900">
                    {numberFormatter.format(entry.hours)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Υπερωρίες</dt>
                  <dd className="font-semibold text-slate-900">
                    {numberFormatter.format(entry.overtimeHours)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Έξοδα</dt>
                  <dd className="font-semibold text-slate-900">
                    {currencyFormatter.format(entry.expenseAmount)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Δεν υπάρχουν πρόσφατες καταχωρήσεις ημερήσιας εργασίας για τον
          επιλεγμένο μήνα.
        </div>
      )}
    </section>
  );
}
