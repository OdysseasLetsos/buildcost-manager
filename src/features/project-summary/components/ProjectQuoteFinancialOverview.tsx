import type { ProjectSummaryRow } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function approvedRemaining(project: ProjectSummaryRow): number {
  return project.quoteTotals.approvedQuotesTotal - project.totalCost;
}

export function ProjectQuoteFinancialOverview({
  projects,
}: Readonly<{
  projects: ProjectSummaryRow[];
}>) {
  const overBudgetProjects = projects.filter(
    (project) =>
      project.quoteTotals.approvedQuotesTotal > 0 &&
      project.totalCost > project.quoteTotals.approvedQuotesTotal,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-lg font-semibold text-slate-950">
          Οικονομική εικόνα προσφορών
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Οι εγκεκριμένες προσφορές εμφανίζονται ξεχωριστά από πραγματικά
          κόστη, έσοδα, τιμολόγια και κέρδος.
        </p>
      </div>

      {overBudgetProjects.length > 0 ? (
        <div className="space-y-2 border-b border-amber-100 bg-amber-50 p-4">
          {overBudgetProjects.map((project) => (
            <p key={project.projectId} className="text-sm text-amber-900">
              <span className="font-semibold">
                {project.projectCode} - {project.projectName}:{" "}
              </span>
              Το πραγματικό κόστος έχει ξεπεράσει το εγκεκριμένο ποσό
              προσφορών.
            </p>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-56 px-3 py-3">Έργο</th>
              <th className="w-36 px-3 py-3 text-right">
                Αρχικός προϋπολογισμός
              </th>
              <th className="w-40 px-3 py-3 text-right">
                Σύνολο εγκεκριμένων προσφορών
              </th>
              <th className="w-32 px-3 py-3 text-right">
                Προσφορές σε αναμονή
              </th>
              <th className="w-32 px-3 py-3 text-right">
                Πρόχειρες προσφορές
              </th>
              <th className="w-36 px-3 py-3 text-right">
                Απορριφθείσες προσφορές
              </th>
              <th className="w-32 px-3 py-3 text-right">
                Πραγματικό κόστος
              </th>
              <th className="w-36 px-3 py-3 text-right">
                Καταχωρημένα έσοδα
              </th>
              <th className="w-40 px-3 py-3 text-right">
                Υπόλοιπο εγκεκριμένου ποσού
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project.projectId}>
                <td className="px-3 py-3 font-medium text-slate-950">
                  {project.projectCode} - {project.projectName}
                </td>
                <td className="px-3 py-3 text-right">
                  {currencyFormatter.format(project.quoteTotals.initialBudget)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-emerald-800">
                  {currencyFormatter.format(
                    project.quoteTotals.approvedQuotesTotal,
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  {currencyFormatter.format(
                    project.quoteTotals.pendingQuotesTotal,
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  {currencyFormatter.format(project.quoteTotals.draftQuotesTotal)}
                </td>
                <td className="px-3 py-3 text-right">
                  {currencyFormatter.format(
                    project.quoteTotals.rejectedQuotesTotal,
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  {currencyFormatter.format(project.totalCost)}
                </td>
                <td className="px-3 py-3 text-right">
                  {currencyFormatter.format(project.invoicedRevenue)}
                </td>
                <td
                  className={`px-3 py-3 text-right font-semibold ${
                    approvedRemaining(project) < 0
                      ? "text-red-700"
                      : "text-slate-950"
                  }`}
                >
                  {currencyFormatter.format(approvedRemaining(project))}
                </td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Δεν υπάρχουν δεδομένα προσφορών για την επιλεγμένη περίοδο.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
