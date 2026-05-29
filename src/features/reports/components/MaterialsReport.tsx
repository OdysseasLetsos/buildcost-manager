import type { MaterialsReportRow } from "../types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function MaterialsReport({ rows }: { rows: MaterialsReportRow[] }) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-slate-600">Δεν υπάρχουν δεδομένα για την αναφορά.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              "Ημερομηνία",
              "Έργο",
              "Προμηθευτής",
              "ΑΦΜ Προμηθευτή",
              "Αριθμός Τιμολογίου",
              "Περιγραφή",
              "Καθαρή Αξία",
              "ΦΠΑ",
              "Σύνολο",
              "Κατάσταση Πληρωμής",
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
              <td className="whitespace-nowrap px-3 py-3">{row.invoiceDate}</td>
              <td className="min-w-52 px-3 py-3 font-medium text-slate-950">
                {row.projectLabel}
              </td>
              <td className="px-3 py-3">{row.supplierName}</td>
              <td className="px-3 py-3">{row.supplierVat || "-"}</td>
              <td className="px-3 py-3">{row.invoiceNumber}</td>
              <td className="max-w-64 truncate px-3 py-3">{row.description || "-"}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(row.netAmount)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(row.vatAmount)}</td>
              <td className="px-3 py-3 text-right font-semibold">
                {formatCurrency(row.totalAmount)}
              </td>
              <td className="whitespace-nowrap px-3 py-3">{row.paymentStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
