import type {
  ProjectSummaryReport,
  ProjectSummaryRow,
} from "@/src/features/project-summary/types";
import { projectSummaryStatusLabels } from "../constants";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function Row({ row }: { row: ProjectSummaryRow }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-950">
        {row.projectCode} - {row.projectName}
      </td>
      <td className="px-3 py-3 text-right">{row.hours}</td>
      <td className="px-3 py-3 text-right">{row.overtimeHours}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.costs.allocatedPayments)}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.costs.allocatedIka)}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.costs.materialsCost)}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.costs.allocatedExpenses)}</td>
      <td className="px-3 py-3 text-right font-semibold">{formatCurrency(row.totalCost)}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.invoicedRevenue)}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.receivedRevenue)}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(row.remainingRevenue)}</td>
      <td className="px-3 py-3 text-right font-semibold">{formatCurrency(row.profit)}</td>
      <td className="px-3 py-3 text-right">{formatPercent(row.margin)}</td>
      <td className="whitespace-nowrap px-3 py-3">{projectSummaryStatusLabels[row.status]}</td>
    </tr>
  );
}

export function MonthlyProjectSummaryReport({
  report,
}: {
  report: ProjectSummaryReport;
}) {
  if (!report.projects.length) {
    return <p className="p-6 text-sm text-slate-600">Δεν υπάρχουν δεδομένα για την αναφορά.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1180px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              "Έργο",
              "Ώρες",
              "Υπερωρίες",
              "Πληρωμές",
              "ΙΚΑ",
              "Υλικά",
              "Έξοδα",
              "Συνολικό Κόστος",
              "Έσοδα",
              "Εισπραχθέντα",
              "Υπόλοιπο",
              "Κέρδος",
              "Περιθώριο",
              "Κατάσταση",
            ].map((label) => (
              <th className="px-3 py-3" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {report.projects.map((row) => (
            <Row key={row.projectId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
