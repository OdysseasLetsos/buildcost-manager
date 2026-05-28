"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import { createExpense } from "../actions/create-expense";
import { updateExpense } from "../actions/update-expense";
import type { ExpenseScope } from "../constants";
import { expenseScopeLabels } from "../constants";
import { getExpensesSummary } from "../services/get-expenses-summary";
import type {
  ExpenseAllocationPreview as ExpenseAllocationPreviewData,
  ExpenseWithRelations,
} from "../types";
import { ExpenseAllocationPreview } from "./ExpenseAllocationPreview";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseScopeTabs } from "./ExpenseScopeTabs";
import { ExpensesSummaryCards } from "./ExpensesSummaryCards";
import { ExpensesTable } from "./ExpensesTable";

type ExpenseTab = ExpenseScope | "allocation";

function filterExpenses(
  expenses: ExpenseWithRelations[],
  filters: {
    monthId: string;
    scope: ExpenseScope;
    category: string;
    allocationMethod: string;
    search: string;
  },
) {
  const search = filters.search.trim().toLowerCase();
  return expenses.filter(
    (expense) =>
      (!filters.monthId || expense.month_id === filters.monthId) &&
      expense.scope === filters.scope &&
      (!filters.category || expense.category === filters.category) &&
      (!filters.allocationMethod ||
        expense.allocation_method === filters.allocationMethod) &&
      (!search ||
        expense.category.toLowerCase().includes(search) ||
        (expense.description ?? "").toLowerCase().includes(search) ||
        (expense.notes ?? "").toLowerCase().includes(search)),
  );
}

export function ExpensesPageClient({
  expenses,
  monthlyPeriods,
  defaultMonthId,
  canManage,
  featureAvailable,
  allocationPreview,
}: Readonly<{
  expenses: ExpenseWithRelations[];
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthId: string;
  canManage: boolean;
  featureAvailable: boolean;
  allocationPreview: Record<string, ExpenseAllocationPreviewData>;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ExpenseTab>("general");
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [category, setCategory] = useState("");
  const [allocationMethod, setAllocationMethod] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null);

  const effectiveMonthId = monthId || defaultMonthId;
  const selectedMonth = monthlyPeriods.find((period) => period.id === effectiveMonthId);
  const selectedMonthLocked =
    selectedMonth?.status === "locked" || selectedMonth?.is_locked === true;
  const openMonthlyPeriods = monthlyPeriods.filter(
    (period) => period.status === "open" && !period.is_locked,
  );
  const lockedMonthIds = useMemo(
    () =>
      monthlyPeriods
        .filter((period) => period.status === "locked" || period.is_locked)
        .map((period) => period.id),
    [monthlyPeriods],
  );
  const activeScope: ExpenseScope = activeTab === "office" ? "office" : "general";
  const filteredExpenses = useMemo(
    () =>
      filterExpenses(expenses, {
        monthId: effectiveMonthId,
        scope: activeScope,
        category,
        allocationMethod,
        search,
      }),
    [activeScope, allocationMethod, category, effectiveMonthId, expenses, search],
  );
  const summaryExpenses = useMemo(
    () => {
      const normalizedSearch = search.trim().toLowerCase();

      return expenses.filter(
        (expense) =>
          (!effectiveMonthId || expense.month_id === effectiveMonthId) &&
          (!category || expense.category === category) &&
          (!allocationMethod || expense.allocation_method === allocationMethod) &&
          (!normalizedSearch ||
            expense.category.toLowerCase().includes(normalizedSearch) ||
            (expense.description ?? "").toLowerCase().includes(normalizedSearch) ||
            (expense.notes ?? "").toLowerCase().includes(normalizedSearch)),
      );
    },
    [allocationMethod, category, effectiveMonthId, expenses, search],
  );
  const summary = useMemo(() => getExpensesSummary(summaryExpenses), [summaryExpenses]);
  const selectedAllocationPreview = allocationPreview[effectiveMonthId] ?? {
    projectTotals: [],
    warnings: [],
  };
  const canMutate = canManage && featureAvailable && !selectedMonthLocked;

  function handleSuccess() {
    setShowForm(false);
    setEditingExpense(null);
    router.refresh();
  }

  function handleTabChange(tab: ExpenseTab) {
    setActiveTab(tab);
    setCategory("");
    setShowForm(false);
    setEditingExpense(null);
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Έξοδα</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχείριση γενικών εξόδων και εξόδων έδρας της εταιρείας.
          </p>
        </div>
        {activeTab !== "allocation" && canMutate ? (
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setShowForm((value) => !value);
            }}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Νέο Έξοδο
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Έξοδα.
        </section>
      ) : null}

      {selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      <ExpensesSummaryCards summary={summary} />
      <ExpenseScopeTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <ExpenseFilters
        monthId={monthId}
        scope={activeScope}
        category={category}
        allocationMethod={allocationMethod}
        search={search}
        monthlyPeriods={monthlyPeriods}
        onMonthChange={setMonthId}
        onCategoryChange={setCategory}
        onAllocationMethodChange={setAllocationMethod}
        onSearchChange={setSearch}
      />

      {activeTab !== "allocation" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-950">
              {expenseScopeLabels[activeScope]}
            </h3>
          </div>

          {(showForm || editingExpense) && canMutate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ExpenseForm
                action={editingExpense ? updateExpense : createExpense}
                expense={editingExpense ?? undefined}
                monthlyPeriods={openMonthlyPeriods}
                defaultMonthId={effectiveMonthId}
                defaultScope={activeScope}
                submitLabel={
                  editingExpense ? "Αποθήκευση Αλλαγών" : "Δημιουργία Εξόδου"
                }
                onSuccess={handleSuccess}
              />
            </section>
          ) : null}

          <ExpensesTable
            expenses={filteredExpenses}
            canManage={canManage && featureAvailable}
            lockedMonthIds={lockedMonthIds}
            onEditExpense={(expense) => {
              setShowForm(false);
              setActiveTab(expense.scope);
              setEditingExpense(expense);
            }}
          />
        </div>
      ) : (
        <ExpenseAllocationPreview preview={selectedAllocationPreview} />
      )}
    </div>
  );
}
