import Link from "next/link";
import type { DashboardMonthlyPeriodStats } from "../types";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("el-GR");
}

export function MonthlyPeriodsOverviewSection({
  monthlyPeriodStats,
}: Readonly<{
  monthlyPeriodStats: DashboardMonthlyPeriodStats;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Μήνες</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Λογιστικές περίοδοι
          </h2>
        </div>
        <Link
          href="/months"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Προβολή
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">Τελευταίος ανοιχτός μήνας</p>
        <p className="mt-2 text-3xl font-semibold text-blue-950">
          {monthlyPeriodStats.latestOpenMonth?.month_key ?? "-"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Ανοιχτοί</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">
            {monthlyPeriodStats.openMonths}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Κλειδωμένοι</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {monthlyPeriodStats.lockedMonths}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {monthlyPeriodStats.latestMonthlyPeriods.map((period) => (
          <div
            key={period.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {period.month_key}
              </p>
              <p className="text-xs text-slate-500">
                {period.status === "locked"
                  ? `Κλειδώθηκε: ${formatDateTime(period.locked_at)}`
                  : `Δημιουργήθηκε: ${formatDateTime(period.created_at)}`}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                period.status === "open"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              {period.status === "open" ? "Ανοιχτός" : "Κλειδωμένος"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
