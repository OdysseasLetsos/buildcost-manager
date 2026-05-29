import type { EmployeeWorkReportRow } from "../types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function EmployeeWorkReport({ rows }: { rows: EmployeeWorkReportRow[] }) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-slate-600">Δεν υπάρχουν δεδομένα για την αναφορά.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              "Εργαζόμενος",
              "Σύνολο Ωρών",
              "Σύνολο Υπερωριών",
              "Έξοδα Εργαζομένου",
              "Πληρωμές",
              "ΙΚΑ",
              "Έργα που δούλεψε",
            ].map((label) => (
              <th className="px-3 py-3" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {rows.map((row) => (
            <tr className="border-b border-slate-100 last:border-0" key={row.employeeId}>
              <td className="px-3 py-3 font-medium text-slate-950">{row.employeeName}</td>
              <td className="px-3 py-3 text-right">{row.totalHours}</td>
              <td className="px-3 py-3 text-right">{row.totalOvertimeHours}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(row.employeeExpenses)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(row.payments)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(row.ika)}</td>
              <td className="px-3 py-3">{row.projectLabels.join(", ") || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
