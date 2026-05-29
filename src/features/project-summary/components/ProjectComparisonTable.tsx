import type { ProjectSummaryRow, ProjectSummaryStatus } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("el-GR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const statusLabels: Record<ProjectSummaryStatus, string> = {
  healthy: "Υγιές",
  low_margin: "Χαμηλό Περιθώριο",
  loss: "Ζημιά",
  no_revenue: "Χωρίς Έσοδα",
};

const statusClasses: Record<ProjectSummaryStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800",
  low_margin: "bg-amber-50 text-amber-800",
  loss: "bg-red-50 text-red-800",
  no_revenue: "bg-slate-100 text-slate-700",
};

export function ProjectComparisonTable({
  projects,
}: Readonly<{
  projects: ProjectSummaryRow[];
}>) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1480px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-52 px-3 py-3">Έργο</th>
              <th className="w-20 px-3 py-3 text-right">Ώρες</th>
              <th className="w-24 px-3 py-3 text-right">Υπερωρίες</th>
              <th className="w-28 px-3 py-3 text-right">Πληρωμές</th>
              <th className="w-28 px-3 py-3 text-right">ΙΚΑ</th>
              <th className="w-28 px-3 py-3 text-right">Υλικά</th>
              <th className="w-28 px-3 py-3 text-right">Έξοδα</th>
              <th className="w-32 px-3 py-3 text-right">Συνολικό Κόστος</th>
              <th className="w-32 px-3 py-3 text-right">Έσοδα</th>
              <th className="w-32 px-3 py-3 text-right">Εισπραχθέντα</th>
              <th className="w-28 px-3 py-3 text-right">Υπόλοιπο</th>
              <th className="w-28 px-3 py-3 text-right">Κέρδος</th>
              <th className="w-24 px-3 py-3 text-right">Περιθώριο</th>
              <th className="w-40 px-3 py-3">Κατάσταση</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project.projectId}>
                <td className="px-3 py-3 font-medium text-slate-950">
                  {project.projectCode} - {project.projectName}
                </td>
                <td className="px-3 py-3 text-right">{numberFormatter.format(project.hours)}</td>
                <td className="px-3 py-3 text-right">{numberFormatter.format(project.overtimeHours)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.costs.allocatedPayments)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.costs.allocatedIka)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.costs.materialsCost)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.costs.allocatedExpenses)}</td>
                <td className="px-3 py-3 text-right font-semibold">{currencyFormatter.format(project.totalCost)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.invoicedRevenue)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.receivedRevenue)}</td>
                <td className="px-3 py-3 text-right">{currencyFormatter.format(project.remainingRevenue)}</td>
                <td className="px-3 py-3 text-right font-semibold">{currencyFormatter.format(project.profit)}</td>
                <td className="px-3 py-3 text-right">
                  {project.margin === null ? "-" : percentFormatter.format(project.margin)}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                  Δεν υπάρχουν δεδομένα σύνοψης για τον επιλεγμένο μήνα.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
