import type {
  SupplierOutstandingBalance,
  SupplierOutstandingBalancesReport,
} from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

const paymentStatusLabels: Record<string, string> = {
  pending: "Εκκρεμεί",
  partial: "Μερικώς πληρωμένο",
  paid: "Πληρωμένο",
};

function filterSupplierBalances(
  report: SupplierOutstandingBalancesReport,
  projectId: string,
): SupplierOutstandingBalancesReport {
  if (!projectId) return report;

  const suppliers: SupplierOutstandingBalance[] = report.suppliers
    .map((supplier) => {
      const invoices = supplier.invoices.filter(
        (invoice) => invoice.projectId === projectId,
      );
      const totalOutstandingAmount = invoices.reduce(
        (sum, invoice) => sum + invoice.remainingAmount,
        0,
      );

      return {
        ...supplier,
        invoices,
        totalOutstandingAmount,
        pendingInvoiceCount: invoices.length,
      };
    })
    .filter((supplier) => supplier.pendingInvoiceCount > 0);

  return {
    totalOutstandingAmount: suppliers.reduce(
      (sum, supplier) => sum + supplier.totalOutstandingAmount,
      0,
    ),
    suppliers,
  };
}

export function SupplierOutstandingBalancesSection({
  balances,
  projectId,
}: Readonly<{
  balances: SupplierOutstandingBalancesReport;
  projectId: string;
}>) {
  const visibleBalances = filterSupplierBalances(balances, projectId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Προμηθευτές</h3>
          <p className="mt-1 text-sm text-slate-600">
            Εκκρεμότητες προμηθευτών από τιμολόγια υλικών
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
            Οι εκκρεμότητες προμηθευτών εμφανίζουν τι δεν έχει πληρωθεί ακόμα από
            τιμολόγια υλικών. Δεν προστίθενται δεύτερη φορά στο κόστος έργου.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
          <p className="font-medium text-blue-700">Σύνολο εκκρεμών</p>
          <p className="mt-1 text-xl font-semibold text-blue-950">
            {currencyFormatter.format(visibleBalances.totalOutstandingAmount)}
          </p>
        </div>
      </div>

      {visibleBalances.suppliers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Δεν υπάρχουν εκκρεμότητες προμηθευτών για την επιλεγμένη περίοδο.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleBalances.suppliers.map((supplier) => (
            <article
              key={
                supplier.supplierId ??
                `${supplier.supplierName}-${supplier.supplierTaxId ?? ""}`
              }
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <div className="grid gap-3 bg-slate-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {supplier.supplierName}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    ΑΦΜ: {supplier.supplierTaxId?.trim() || "-"}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-500">Σύνολο εκκρεμών</p>
                  <p className="font-semibold text-slate-950">
                    {currencyFormatter.format(supplier.totalOutstandingAmount)}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-500">Τιμολόγια</p>
                  <p className="font-semibold text-slate-950">
                    {supplier.pendingInvoiceCount}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Έργο</th>
                      <th className="px-4 py-3">Ημερομηνία τιμολογίου</th>
                      <th className="px-4 py-3">Αριθμός τιμολογίου</th>
                      <th className="px-4 py-3 text-right">Σύνολο τιμολογίου</th>
                      <th className="px-4 py-3 text-right">Πληρωμένο ποσό</th>
                      <th className="px-4 py-3 text-right">Υπόλοιπο</th>
                      <th className="px-4 py-3 text-right">Ποσοστό εκκρεμότητας</th>
                      <th className="px-4 py-3">Κατάσταση πληρωμής</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplier.invoices.map((invoice) => (
                      <tr key={invoice.invoiceId}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {invoice.projectName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {invoice.invoiceDate}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {currencyFormatter.format(invoice.totalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {currencyFormatter.format(invoice.paidAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-800">
                          {currencyFormatter.format(invoice.remainingAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {invoice.pendingPercentage.toFixed(2)}%
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {paymentStatusLabels[invoice.paymentStatus] ??
                            invoice.paymentStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
