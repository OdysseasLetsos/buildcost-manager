import type { DashboardRecentActivity } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function RecentActivityList({
  activities,
}: Readonly<{
  activities: DashboardRecentActivity[];
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">Πρόσφατες Κινήσεις</h2>
      <div className="mt-5 space-y-3">
        {activities.map((activity) => (
          <article key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                  {activity.typeLabel}
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-950">{activity.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {activity.category}{activity.projectLabel ? ` · ${activity.projectLabel}` : ""}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-blue-700">{dateFormatter.format(new Date(activity.date))}</p>
                {activity.amount !== undefined ? (
                  <p className="mt-2 font-semibold text-slate-950">{currencyFormatter.format(activity.amount)}</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Δεν υπάρχουν πρόσφατες κινήσεις για τον επιλεγμένο μήνα.
          </p>
        ) : null}
      </div>
    </section>
  );
}
