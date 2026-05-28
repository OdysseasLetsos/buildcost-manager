"use client";

import { Fragment, useActionState, useState } from "react";
import { deleteExpense } from "../actions/delete-expense";
import { expenseScopeLabels } from "../constants";
import type { ExpenseWithRelations } from "../types";
import { initialExpenseActionState } from "../types";
import { AllocationMethodBadge } from "./AllocationMethodBadge";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

function DeleteExpenseButton({ expenseId }: Readonly<{ expenseId: string }>) {
  const [, formAction, isPending] = useActionState(deleteExpense, initialExpenseActionState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Θέλετε σίγουρα να διαγράψετε αυτό το έξοδο;")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={expenseId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
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

export function ExpensesTable({
  expenses,
  canManage,
  lockedMonthIds = [],
  onEditExpense,
}: Readonly<{
  expenses: ExpenseWithRelations[];
  canManage: boolean;
  lockedMonthIds?: string[];
  onEditExpense: (expense: ExpenseWithRelations) => void;
}>) {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const lockedMonthSet = new Set(lockedMonthIds);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-28 whitespace-nowrap px-3 py-3">Ημερομηνία</th>
              <th className="w-32 whitespace-nowrap px-3 py-3">Τύπος</th>
              <th className="w-40 px-3 py-3">Κατηγορία</th>
              <th className="w-52 px-3 py-3">Περιγραφή</th>
              <th className="w-28 whitespace-nowrap px-3 py-3 text-right">Ποσό</th>
              <th className="w-44 px-3 py-3">Μέθοδος Κατανομής</th>
              <th className="sticky right-0 z-10 w-44 whitespace-nowrap bg-slate-50 px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                Ενέργειες
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => {
              const isExpanded = expandedExpenseId === expense.id;
              const isLocked = lockedMonthSet.has(expense.month_id);
              const canManageRow = canManage && !isLocked;

              return (
                <Fragment key={expense.id}>
                  <tr className="align-top">
                    <td className="whitespace-nowrap px-3 py-3">{expense.expense_date}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {expenseScopeLabels[expense.scope]}
                    </td>
                    <td className="px-3 py-3">
                      <ExpenseCategoryBadge category={expense.category} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="truncate text-slate-700" title={expense.description ?? ""}>
                        {expense.description ?? "-"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
                      {currencyFormatter.format(expense.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <AllocationMethodBadge method={expense.allocation_method} />
                    </td>
                    <td className="sticky right-0 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {isExpanded ? "Κλείσιμο" : "Λεπτομέρειες"}
                        </button>
                        {canManageRow ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditExpense(expense)}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Επεξ.
                            </button>
                            <DeleteExpenseButton expenseId={expense.id} />
                          </>
                        ) : isLocked && canManage ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                            Κλειδωμένος
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr>
                      <td colSpan={7} className="bg-slate-50 px-4 py-4">
                        <dl className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
                          <DetailItem label="Μήνας" value={expense.monthKey} />
                          <DetailItem label="Περιγραφή" value={expense.description} />
                          <DetailItem label="Σημειώσεις" value={expense.notes} />
                          <DetailItem label="Δημιουργήθηκε" value={expense.created_at} />
                          <DetailItem label="Ενημερώθηκε" value={expense.updated_at} />
                        </dl>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Δεν υπάρχουν έξοδα για τα επιλεγμένα φίλτρα.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
