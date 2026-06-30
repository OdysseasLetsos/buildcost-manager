"use client";

import { useActionState } from "react";
import { deleteEmployeeBenefit } from "../actions/delete-employee-benefit";
import { employeeBenefitTypeLabels } from "../constants";
import type { EmployeeBenefitWithRelations } from "../types";
import { initialBenefitActionState } from "../types";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeleteBenefitButton({ benefitId }: Readonly<{ benefitId: string }>) {
  const [, formAction, isPending] = useActionState(
    deleteEmployeeBenefit,
    initialBenefitActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={benefitId} />
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

export function BenefitsTable({
  benefits,
  canManage,
  onEditBenefit,
}: Readonly<{
  benefits: EmployeeBenefitWithRelations[];
  canManage: boolean;
  onEditBenefit: (benefit: EmployeeBenefitWithRelations) => void;
}>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Ημερομηνία</th>
              <th className="px-4 py-3">Εργαζόμενος</th>
              <th className="px-4 py-3">Τύπος</th>
              <th className="px-4 py-3">Ποσό</th>
              <th className="px-4 py-3">Σημειώσεις</th>
              <th className="px-4 py-3">Ενέργειες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {benefits.map((benefit) => (
              <tr key={benefit.id}>
                <td className="px-4 py-3">{benefit.benefit_date}</td>
                <td className="px-4 py-3 font-medium text-slate-950">
                  {benefit.employeeName}
                </td>
                <td className="px-4 py-3">
                  {employeeBenefitTypeLabels[benefit.benefit_type]}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {currencyFormatter.format(benefit.amount)}
                </td>
                <td className="px-4 py-3 text-slate-600">{benefit.notes ?? "-"}</td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onEditBenefit(benefit)}
                        className="text-xs font-semibold text-blue-700"
                      >
                        Επεξεργασία
                      </button>
                      <DeleteBenefitButton benefitId={benefit.id} />
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
            {benefits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Δεν υπάρχουν επιδόματα ή δώρα για τον επιλεγμένο μήνα.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
