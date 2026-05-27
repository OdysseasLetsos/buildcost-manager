"use client";

import { useActionState } from "react";
import { lockMonthlyPeriod } from "../actions/lock-monthly-period";
import { reopenMonthlyPeriod } from "../actions/reopen-monthly-period";
import type { MonthlyPeriod } from "../types";
import { initialMonthlyPeriodActionState } from "../types";
import { MonthlyPeriodStatusBadge } from "./MonthlyPeriodStatusBadge";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("el-GR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function MonthActionButton({
  monthlyPeriod,
}: Readonly<{
  monthlyPeriod: MonthlyPeriod;
}>) {
  const isLocked = monthlyPeriod.status === "locked" || monthlyPeriod.is_locked;
  const [state, formAction, isPending] = useActionState(
    isLocked ? reopenMonthlyPeriod : lockMonthlyPeriod,
    initialMonthlyPeriodActionState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="monthId" value={monthlyPeriod.id} />
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
          isLocked
            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            : "border-blue-200 text-blue-700 hover:bg-blue-50"
        }`}
      >
        {isPending ? "..." : isLocked ? "Άνοιγμα" : "Κλείδωμα"}
      </button>
      {state.message && !state.ok ? (
        <span className="text-xs text-red-700">{state.message}</span>
      ) : null}
    </form>
  );
}

export function MonthlyPeriodsTable({
  monthlyPeriods,
  canManageLocks,
}: Readonly<{
  monthlyPeriods: MonthlyPeriod[];
  canManageLocks: boolean;
}>) {
  if (monthlyPeriods.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Δεν υπάρχουν μήνες ακόμα
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Δημιουργήστε τον πρώτο λογιστικό μήνα για να ξεκινήσει η οργάνωση
          καταχωρήσεων.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Μήνας</th>
              <th className="px-5 py-3 font-semibold">Κατάσταση</th>
              <th className="px-5 py-3 font-semibold">Δημιουργήθηκε</th>
              <th className="px-5 py-3 font-semibold">Κλειδώθηκε</th>
              <th className="px-5 py-3 font-semibold">Κλειδώθηκε από</th>
              <th className="px-5 py-3 font-semibold">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyPeriods.map((monthlyPeriod) => {
              const isLocked =
                monthlyPeriod.status === "locked" || monthlyPeriod.is_locked;

              return (
                <tr key={monthlyPeriod.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">
                    {monthlyPeriod.month_key}
                  </td>
                  <td className="px-5 py-4">
                    <MonthlyPeriodStatusBadge status={monthlyPeriod.status} />
                    {isLocked ? (
                      <p className="mt-2 text-xs text-blue-700">
                        Ο μήνας είναι κλειδωμένος και προστατεύεται από αλλαγές.
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {formatDateTime(monthlyPeriod.created_at)}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {formatDateTime(monthlyPeriod.locked_at)}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {monthlyPeriod.locked_by ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    {canManageLocks ? (
                      <MonthActionButton monthlyPeriod={monthlyPeriod} />
                    ) : (
                      <span className="text-xs text-slate-500">Προβολή μόνο</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
