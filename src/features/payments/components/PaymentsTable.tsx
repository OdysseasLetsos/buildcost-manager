"use client";

import { useActionState } from "react";
import { deleteEmployeePayment } from "../actions/delete-employee-payment";
import type { EmployeePaymentWithRelations } from "../types";
import { initialPaymentActionState } from "../types";
import { PaymentMethodBadge } from "./PaymentMethodBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeletePaymentButton({ paymentId }: Readonly<{ paymentId: string }>) {
  const [, formAction, isPending] = useActionState(
    deleteEmployeePayment,
    initialPaymentActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={paymentId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-semibold text-red-700 transition hover:text-red-800 disabled:opacity-60"
      >
        Διαγραφή
      </button>
    </form>
  );
}

export function PaymentsTable({
  payments,
  canManage,
  onEditPayment,
}: Readonly<{
  payments: EmployeePaymentWithRelations[];
  canManage: boolean;
  onEditPayment: (payment: EmployeePaymentWithRelations) => void;
}>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Ημερομηνία</th>
            <th className="px-4 py-3">Εργαζόμενος</th>
            <th className="px-4 py-3">Ποσό</th>
            <th className="px-4 py-3">Τρόπος Πληρωμής</th>
            <th className="px-4 py-3">Σημειώσεις</th>
            <th className="px-4 py-3">Ενέργειες</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-4 py-3">{payment.payment_date}</td>
              <td className="px-4 py-3 font-medium text-slate-950">
                {payment.employeeName}
              </td>
              <td className="px-4 py-3 font-semibold">
                {currencyFormatter.format(payment.amount)}
              </td>
              <td className="px-4 py-3">
                <PaymentMethodBadge method={payment.payment_method} />
              </td>
              <td className="px-4 py-3 text-slate-600">{payment.notes ?? "-"}</td>
              <td className="px-4 py-3">
                {canManage ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEditPayment(payment)}
                      className="text-xs font-semibold text-blue-700"
                    >
                      Επεξεργασία
                    </button>
                    <DeletePaymentButton paymentId={payment.id} />
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
          {payments.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                Δεν υπάρχουν πληρωμές για τα επιλεγμένα φίλτρα.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
