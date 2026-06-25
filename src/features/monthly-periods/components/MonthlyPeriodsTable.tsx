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
  currentMonthKey,
}: Readonly<{
  monthlyPeriod: MonthlyPeriod;
  currentMonthKey: string;
}>) {
  const isLocked = monthlyPeriod.status === "locked" || monthlyPeriod.is_locked;
  const isFutureMonth = monthlyPeriod.month_key > currentMonthKey;
  const [state, formAction, isPending] = useActionState(
    isLocked ? reopenMonthlyPeriod : lockMonthlyPeriod,
    initialMonthlyPeriodActionState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input type="hidden" name="monthId" value={monthlyPeriod.id} />
        <button
          type="submit"
          disabled={isPending || isFutureMonth}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isLocked
              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              : "border-blue-200 text-blue-700 hover:bg-blue-50"
          }`}
        >
          {isPending ? "..." : isLocked ? "Ξεκλείδωμα" : "Κλείδωμα"}
        </button>
      </div>
      {isFutureMonth ? (
        <span className="max-w-56 text-xs text-slate-500">
          Ο μήνας θα μπορεί να ανοίξει όταν ξεκινήσει ημερολογιακά.
        </span>
      ) : null}
      {state.message && !state.ok ? (
        <span className="max-w-56 text-xs text-red-700">{state.message}</span>
      ) : null}
    </form>
  );
}

export function MonthlyPeriodsTable({
  monthlyPeriods,
  currentMonthKey,
  canManageLocks,
}: Readonly<{
  monthlyPeriods: MonthlyPeriod[];
  currentMonthKey: string;
  canManageLocks: boolean;
}>) {
  if (monthlyPeriods.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Δεν υπάρχουν μήνες ακόμα
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Δημιουργήστε τον τρέχοντα ή προηγούμενο λογιστικό μήνα για να
          οργανώσετε τις καταχωρήσεις.
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
              const isCurrentMonth = monthlyPeriod.month_key === currentMonthKey;
              const isFutureMonth = monthlyPeriod.month_key > currentMonthKey;
              const isPastMonth = monthlyPeriod.month_key < currentMonthKey;
              const isUnlockedPastMonth = isPastMonth && !isLocked;

              return (
                <tr key={monthlyPeriod.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">
                    <div className="flex flex-col gap-2">
                      <span>{monthlyPeriod.month_key}</span>
                      {isCurrentMonth ? (
                        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                          Τρέχων μήνας
                        </span>
                      ) : null}
                      {isUnlockedPastMonth ? (
                        <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          Ξεκλείδωτος για διορθώσεις
                        </span>
                      ) : null}
                      {isFutureMonth ? (
                        <span className="w-fit rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          Μελλοντικός μήνας
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <MonthlyPeriodStatusBadge status={monthlyPeriod.status} />
                    {isLocked ? (
                      <p className="mt-2 text-xs text-blue-700">
                        Ο μήνας είναι κλειδωμένος και προστατεύεται από αλλαγές.
                      </p>
                    ) : null}
                    {isUnlockedPastMonth ? (
                      <p className="mt-2 text-xs text-emerald-700">
                        Κλειδώστε ξανά τον μήνα όταν ολοκληρωθούν οι διορθώσεις.
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
                      <MonthActionButton
                        monthlyPeriod={monthlyPeriod}
                        currentMonthKey={currentMonthKey}
                      />
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
