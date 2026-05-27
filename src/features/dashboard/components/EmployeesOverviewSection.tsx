import Link from "next/link";
import type { DashboardEmployeeStats } from "../types";

const employeeTypeLabels = {
  permanent: "Μόνιμοι",
  daily_worker: "Ημερομίσθιοι",
  subcontractor: "Συνεργάτες",
};

export function EmployeesOverviewSection({
  employeeStats,
}: Readonly<{
  employeeStats: DashboardEmployeeStats;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Εργαζόμενοι</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Ομάδα εταιρείας
          </h2>
        </div>
        <Link
          href="/employees"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Προβολή
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Ενεργοί</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-950">
            {employeeStats.activeEmployees}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Ανενεργοί</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {employeeStats.inactiveEmployees}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {Object.entries(employeeStats.byType).map(([type, count]) => (
          <div
            key={type}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-700">
              {employeeTypeLabels[type as keyof typeof employeeTypeLabels]}
            </span>
            <span className="text-sm font-semibold text-slate-950">{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
