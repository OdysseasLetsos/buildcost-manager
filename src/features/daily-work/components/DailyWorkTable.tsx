"use client";

import { useActionState } from "react";
import { deleteDailyWorkEntry } from "../actions/delete-daily-work-entry";
import type { DailyWorkEntryWithRelations } from "../types";
import { initialDailyWorkActionState } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeleteButton({ entryId }: Readonly<{ entryId: string }>) {
  const [state, formAction, isPending] = useActionState(
    deleteDailyWorkEntry,
    initialDailyWorkActionState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="entryId" value={entryId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "..." : "Διαγραφή"}
      </button>
      {state.message && !state.ok ? (
        <span className="text-xs text-red-700">{state.message}</span>
      ) : null}
    </form>
  );
}

export function DailyWorkTable({
  entries,
  canManage,
  onEditEntry,
}: Readonly<{
  entries: DailyWorkEntryWithRelations[];
  canManage: boolean;
  onEditEntry: (entry: DailyWorkEntryWithRelations) => void;
}>) {
  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Δεν υπάρχουν καταχωρήσεις
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Καταχωρήστε ημερήσια εργασία για εργαζόμενο, έργο και ανοιχτό μήνα.
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
              <th className="px-5 py-3 font-semibold">Ημερομηνία</th>
              <th className="px-5 py-3 font-semibold">Εργαζόμενος</th>
              <th className="px-5 py-3 font-semibold">Έργο</th>
              <th className="px-5 py-3 font-semibold">Ώρες</th>
              <th className="px-5 py-3 font-semibold">Υπερωρίες</th>
              <th className="px-5 py-3 font-semibold">Έξοδα</th>
              <th className="px-5 py-3 font-semibold">Περιγραφή</th>
              <th className="px-5 py-3 font-semibold">Σημειώσεις</th>
              <th className="px-5 py-3 font-semibold">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-5 py-4 font-medium text-slate-950">
                  {new Date(entry.work_date).toLocaleDateString("el-GR")}
                </td>
                <td className="px-5 py-4 text-slate-700">{entry.employeeName}</td>
                <td className="px-5 py-4 text-slate-700">
                  {entry.projectCode} - {entry.projectName}
                </td>
                <td className="px-5 py-4 text-slate-700">{Number(entry.hours)}</td>
                <td className="px-5 py-4 text-slate-700">
                  {Number(entry.overtime_hours)}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {currencyFormatter.format(Number(entry.expense_amount))}
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-slate-700">
                  {entry.work_description ?? entry.expense_description ?? "-"}
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-slate-700">
                  {entry.notes ?? "-"}
                </td>
                <td className="px-5 py-4">
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Επεξεργασία
                      </button>
                      <DeleteButton entryId={entry.id} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Προβολή μόνο</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
