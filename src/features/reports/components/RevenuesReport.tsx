import type { RevenuesReportRow } from "../types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function RevenuesReport({ rows }: { rows: RevenuesReportRow[] }) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-slate-600">Δεν υπάρχουν δεδομένα για την αναφορά.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              "Ημερομηνία",
              "Έργο",
              "Πελάτης",
              "Αριθμός Τιμολογίου",
              "Τύπος",
              "Τιμολογηθέντα",
              "Εισπραχθέντα",
              "Υπόλοιπο",
              "Κατάσταση",
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
              <td className="whitespace-nowrap px-3 py-3">{row.revenueDate}</td>
              <td className="min-w-52 px-3 py-3 font-medium text-slate-950">
                {row.projectLabel}
              </td>
              <td className="px-3 py-3">{row.clientName}</td>
              <td className="px-3 py-3">{row.invoiceNumber || "-"}</td>
              <td className="px-3 py-3">{row.revenueType}</td>
              <td className="px-3 py-3 text-right">
                {formatCurrency(row.invoicedAmount)}
              </td>
              <td className="px-3 py-3 text-right">
                {formatCurrency(row.receivedAmount)}
              </td>
              <td className="px-3 py-3 text-right">
                {formatCurrency(row.remainingAmount)}
              </td>
              <td className="whitespace-nowrap px-3 py-3">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
