"use client";

import { Fragment, useActionState, useState } from "react";
import { deleteRevenue } from "../actions/delete-revenue";
import { revenuePaymentMethodLabels } from "../constants";
import type { RevenueWithRelations } from "../types";
import { initialRevenueActionState } from "../types";
import { RevenueStatusBadge } from "./RevenueStatusBadge";
import { RevenueTypeBadge } from "./RevenueTypeBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeleteRevenueButton({ revenueId }: Readonly<{ revenueId: string }>) {
  const [, formAction, isPending] = useActionState(deleteRevenue, initialRevenueActionState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Θέλετε σίγουρα να διαγράψετε αυτό το έσοδο;")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={revenueId} />
      <button type="submit" disabled={isPending} className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
        Διαγραφή
      </button>
    </form>
  );
}

function DetailItem({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value?.trim() ? value : "-"}</dd>
    </div>
  );
}

function pendingPercentage(totalAmount: number, remainingAmount: number): string {
  if (totalAmount <= 0) return "0.00";
  return ((remainingAmount / totalAmount) * 100).toFixed(2);
}

export function RevenuesTable({
  revenues,
  canManage,
  lockedMonthIds = [],
  onEditRevenue,
}: Readonly<{
  revenues: RevenueWithRelations[];
  canManage: boolean;
  lockedMonthIds?: string[];
  onEditRevenue: (revenue: RevenueWithRelations) => void;
}>) {
  const [expandedRevenueId, setExpandedRevenueId] = useState<string | null>(null);
  const lockedMonthSet = new Set(lockedMonthIds);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1380px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-28 whitespace-nowrap px-3 py-3">Ημερομηνία</th>
              <th className="w-44 px-3 py-3">Έργο</th>
              <th className="w-40 px-3 py-3">Πελάτης</th>
              <th className="w-36 whitespace-nowrap px-3 py-3">Αρ. Τιμολογίου</th>
              <th className="w-28 whitespace-nowrap px-3 py-3">Τρόπος</th>
              <th className="w-28 whitespace-nowrap px-3 py-3">Τύπος</th>
              <th className="w-32 whitespace-nowrap px-3 py-3 text-right">Συνολικό ποσό</th>
              <th className="w-32 whitespace-nowrap px-3 py-3 text-right">Εισπραχθέντα</th>
              <th className="w-28 whitespace-nowrap px-3 py-3 text-right">Υπόλοιπο</th>
              <th className="w-28 whitespace-nowrap px-3 py-3 text-right">Εκκρ. %</th>
              <th className="w-30 whitespace-nowrap px-3 py-3">Κατάσταση</th>
              <th className="sticky right-0 z-10 w-44 whitespace-nowrap bg-slate-50 px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {revenues.map((revenue) => {
              const isExpanded = expandedRevenueId === revenue.id;
              const isLocked = lockedMonthSet.has(revenue.month_id);
              const canManageRow = canManage && !isLocked;

              return (
                <Fragment key={revenue.id}>
                  <tr className="align-top">
                    <td className="whitespace-nowrap px-3 py-3">{revenue.revenue_date}</td>
                    <td className="px-3 py-3 font-medium text-slate-950">
                      <div className="truncate" title={`${revenue.projectCode} - ${revenue.projectName}`}>
                        {revenue.projectCode} - {revenue.projectName}
                      </div>
                    </td>
                    <td className="px-3 py-3"><div className="truncate" title={revenue.client_name}>{revenue.client_name}</div></td>
                    <td className="px-3 py-3"><div className="truncate" title={revenue.invoice_number ?? ""}>{revenue.invoice_number ?? "-"}</div></td>
                    <td className="px-3 py-3">
                      {revenuePaymentMethodLabels[revenue.payment_method] ??
                        revenue.payment_method}
                    </td>
                    <td className="px-3 py-3"><RevenueTypeBadge type={revenue.revenue_type} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{currencyFormatter.format(revenue.invoiced_amount)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">{currencyFormatter.format(revenue.received_amount)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{currencyFormatter.format(revenue.remaining_amount)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {pendingPercentage(revenue.invoiced_amount, revenue.remaining_amount)}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><RevenueStatusBadge status={revenue.status} /></td>
                    <td className="sticky right-0 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button type="button" onClick={() => setExpandedRevenueId(isExpanded ? null : revenue.id)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                          {isExpanded ? "Κλείσιμο" : "Λεπτομέρειες"}
                        </button>
                        {canManageRow ? (
                          <>
                            <button type="button" onClick={() => onEditRevenue(revenue)} className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Επεξ.</button>
                            <DeleteRevenueButton revenueId={revenue.id} />
                          </>
                        ) : isLocked && canManage ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Κλειδωμένος</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr>
                      <td colSpan={12} className="bg-slate-50 px-4 py-4">
                        <dl className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
                          <DetailItem label="Μήνας" value={revenue.monthKey} />
                          <DetailItem label="Σημειώσεις" value={revenue.notes} />
                          <DetailItem label="Δημιουργήθηκε" value={revenue.created_at} />
                          <DetailItem label="Ενημερώθηκε" value={revenue.updated_at} />
                        </dl>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {revenues.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                  Δεν υπάρχουν έσοδα για τα επιλεγμένα φίλτρα.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
