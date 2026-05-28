"use client";

import { useActionState } from "react";
import { deleteEmployeeIka } from "../actions/delete-employee-ika";
import type { EmployeeIkaWithRelations } from "../types";
import { initialIkaActionState } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeleteIkaButton({ ikaId }: Readonly<{ ikaId: string }>) {
  const [, formAction, isPending] = useActionState(
    deleteEmployeeIka,
    initialIkaActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={ikaId} />
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

export function IkaTable({
  ikaRows,
  canManage,
  onEditIka,
}: Readonly<{
  ikaRows: EmployeeIkaWithRelations[];
  canManage: boolean;
  onEditIka: (ika: EmployeeIkaWithRelations) => void;
}>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Εργαζόμενος</th>
            <th className="px-4 py-3">Μήνας</th>
            <th className="px-4 py-3">Ποσό ΙΚΑ</th>
            <th className="px-4 py-3">Σημειώσεις</th>
            <th className="px-4 py-3">Ενέργειες</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ikaRows.map((ika) => (
            <tr key={ika.id}>
              <td className="px-4 py-3 font-medium text-slate-950">
                {ika.employeeName}
              </td>
              <td className="px-4 py-3">{ika.monthKey}</td>
              <td className="px-4 py-3 font-semibold">
                {currencyFormatter.format(ika.ika_amount)}
              </td>
              <td className="px-4 py-3 text-slate-600">{ika.notes ?? "-"}</td>
              <td className="px-4 py-3">
                {canManage ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEditIka(ika)}
                      className="text-xs font-semibold text-blue-700"
                    >
                      Επεξεργασία
                    </button>
                    <DeleteIkaButton ikaId={ika.id} />
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
          {ikaRows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                Δεν υπάρχουν εγγραφές ΙΚΑ για τα επιλεγμένα φίλτρα.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
