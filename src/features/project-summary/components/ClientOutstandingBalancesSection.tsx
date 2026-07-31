import { revenuePaymentMethodLabels, revenueStatusLabels } from "@/src/features/revenues/constants";
import type {
  ClientOutstandingBalance,
  ClientOutstandingBalancesReport,
} from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function filterClientBalances(
  report: ClientOutstandingBalancesReport,
  projectId: string,
): ClientOutstandingBalancesReport {
  if (!projectId) return report;

  const clients: ClientOutstandingBalance[] = report.clients
    .map((client) => {
      const revenues = client.revenues.filter(
        (revenue) => revenue.projectId === projectId,
      );
      const totalOutstandingAmount = revenues.reduce(
        (sum, revenue) => sum + revenue.remainingAmount,
        0,
      );

      return {
        ...client,
        revenues,
        totalOutstandingAmount,
        pendingRevenueCount: revenues.length,
      };
    })
    .filter((client) => client.pendingRevenueCount > 0);

  return {
    totalOutstandingAmount: clients.reduce(
      (sum, client) => sum + client.totalOutstandingAmount,
      0,
    ),
    clients,
  };
}

export function ClientOutstandingBalancesSection({
  balances,
  projectId,
}: Readonly<{
  balances: ClientOutstandingBalancesReport;
  projectId: string;
}>) {
  const visibleBalances = filterClientBalances(balances, projectId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Πελάτες</h3>
          <p className="mt-1 text-sm text-slate-600">
            Εκκρεμότητες πελατών από έσοδα έργων
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
            Οι εκκρεμότητες πελατών δείχνουν ποσά που δεν έχουν εισπραχθεί
            ακόμα. Δεν προστίθενται δεύτερη φορά στα έσοδα.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
          <p className="font-medium text-emerald-700">Σύνολο εκκρεμών</p>
          <p className="mt-1 text-xl font-semibold text-emerald-950">
            {currencyFormatter.format(visibleBalances.totalOutstandingAmount)}
          </p>
        </div>
      </div>

      {visibleBalances.clients.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Δεν υπάρχουν εκκρεμότητες πελατών για την επιλεγμένη περίοδο.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleBalances.clients.map((client) => (
            <article
              key={client.clientName}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <div className="grid gap-3 bg-slate-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {client.clientName}
                  </h4>
                </div>
                <div className="text-sm">
                  <p className="text-slate-500">Σύνολο εκκρεμών</p>
                  <p className="font-semibold text-slate-950">
                    {currencyFormatter.format(client.totalOutstandingAmount)}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-500">Εγγραφές</p>
                  <p className="font-semibold text-slate-950">
                    {client.pendingRevenueCount}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-y border-slate-200 text-xs uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Έργο</th>
                      <th className="px-4 py-3">Ημερομηνία</th>
                      <th className="px-4 py-3">Αριθμός τιμολογίου</th>
                      <th className="px-4 py-3">Τρόπος είσπραξης</th>
                      <th className="px-4 py-3 text-right">Συνολικό ποσό</th>
                      <th className="px-4 py-3 text-right">Εισπραχθέν ποσό</th>
                      <th className="px-4 py-3 text-right">Υπόλοιπο</th>
                      <th className="px-4 py-3 text-right">Ποσοστό εκκρεμότητας</th>
                      <th className="px-4 py-3">Κατάσταση</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.revenues.map((revenue) => (
                      <tr key={revenue.revenueId}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {revenue.projectName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {revenue.revenueDate}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {revenue.invoiceNumber ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {revenuePaymentMethodLabels[
                            revenue.paymentMethod as keyof typeof revenuePaymentMethodLabels
                          ] ?? revenue.paymentMethod}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {currencyFormatter.format(revenue.totalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {currencyFormatter.format(revenue.receivedAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-800">
                          {currencyFormatter.format(revenue.remainingAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {revenue.pendingPercentage.toFixed(2)}%
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {revenueStatusLabels[
                            revenue.status as keyof typeof revenueStatusLabels
                          ] ?? revenue.status}
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
