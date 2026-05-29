import type { ExpensesReportRow } from "../types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function ExpensesReport({ rows }: { rows: ExpensesReportRow[] }) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-slate-600">Δεν υπάρχουν δεδομένα για την αναφορά.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              "Ημερομηνία",
              "Τύπος",
              "Κατηγορία",
              "Περιγραφή",
              "Ποσό",
              "Μέθοδος Κατανομής",
            ].map((label) => (
              <th className="px-3 py-3" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {rows.map((row) => (
            <tr className="border-b border-slate-100 last:border-0" key={row.id}>
              <td className="whitespace-nowrap px-3 py-3">{row.expenseDate}</td>
              <td className="px-3 py-3">{row.scope}</td>
              <td className="px-3 py-3 font-medium text-slate-950">{row.category}</td>
              <td className="max-w-72 truncate px-3 py-3">{row.description || "-"}</td>
              <td className="px-3 py-3 text-right font-semibold">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-3 py-3">{row.allocationMethod}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Η κατανομή είναι προεπισκόπηση και δεν αποθηκεύεται ακόμα ως οριστική.
      </p>
    </div>
  );
}
