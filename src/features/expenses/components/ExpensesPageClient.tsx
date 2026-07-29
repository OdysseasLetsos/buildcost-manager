"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialsPageClient } from "@/src/features/materials/components/MaterialsPageClient";
import type { MaterialWithRelations, Supplier } from "@/src/features/materials/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import { createExpense } from "../actions/create-expense";
import { updateExpense } from "../actions/update-expense";
import type { ExpenseScope } from "../constants";
import { expenseScopeLabels } from "../constants";
import { getExpensesSummary } from "../services/get-expenses-summary";
import type {
  CompanyOffice,
  CompanyVehicle,
  ExpenseAllocationPreview as ExpenseAllocationPreviewData,
  ExpenseWithRelations,
} from "../types";
import { ExpenseAllocationPreview } from "./ExpenseAllocationPreview";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseForm } from "./ExpenseForm";
import { ExpensesSummaryCards } from "./ExpensesSummaryCards";
import { ExpensesTable } from "./ExpensesTable";

type ExpensesSection = "materials" | "general" | "fixed";

function filterExpenses(
  expenses: ExpenseWithRelations[],
  filters: {
    monthId: string;
    category: string;
    allocationMethod: string;
    search: string;
  },
) {
  const search = filters.search.trim().toLowerCase();
  return expenses.filter(
    (expense) =>
      (!filters.monthId || expense.month_id === filters.monthId) &&
      (!filters.category || expense.category === filters.category) &&
      (!filters.allocationMethod ||
        expense.allocation_method === filters.allocationMethod) &&
      (!search ||
        expense.category.toLowerCase().includes(search) ||
        (expense.description ?? "").toLowerCase().includes(search) ||
        (expense.notes ?? "").toLowerCase().includes(search)),
  );
}

function ExpensesSectionTabs({
  activeSection,
  onSectionChange,
  showMaterials,
  showGeneral,
}: Readonly<{
  activeSection: ExpensesSection;
  onSectionChange: (section: ExpensesSection) => void;
  showMaterials: boolean;
  showGeneral: boolean;
}>) {
  const tabs: { value: ExpensesSection; label: string; visible: boolean }[] = [
    { value: "materials", label: "Υλικά", visible: showMaterials },
    { value: "general", label: "Γενικά έξοδα", visible: showGeneral },
    { value: "fixed", label: "Πάγια έξοδα", visible: true },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs
        .filter((tab) => tab.visible)
        .map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSectionChange(tab.value)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeSection === tab.value
                ? "bg-blue-950 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
    </div>
  );
}

export function ExpensesPageClient({
  expenses,
  offices,
  vehicles,
  materials,
  suppliers,
  projects,
  monthlyPeriods,
  defaultMonthId,
  canManageExpenses,
  canManageMaterials,
  expensesFeatureAvailable,
  materialsFeatureAvailable,
  allocationPreview,
  initialSection,
}: Readonly<{
  expenses: ExpenseWithRelations[];
  offices: CompanyOffice[];
  vehicles: CompanyVehicle[];
  materials: MaterialWithRelations[];
  suppliers: Supplier[];
  projects: Project[];
  monthlyPeriods: MonthlyPeriod[];
  defaultMonthId: string;
  canManageExpenses: boolean;
  canManageMaterials: boolean;
  expensesFeatureAvailable: boolean;
  materialsFeatureAvailable: boolean;
  allocationPreview: Record<string, ExpenseAllocationPreviewData>;
  initialSection?: "materials";
}>) {
  const router = useRouter();
  const canShowMaterials = canManageMaterials && materialsFeatureAvailable;
  const canShowGeneral = canManageExpenses && expensesFeatureAvailable;
  const [activeSection, setActiveSection] = useState<ExpensesSection>(
    initialSection === "materials" && canShowMaterials
      ? "materials"
      : canShowMaterials
        ? "materials"
        : canShowGeneral
          ? "general"
          : "fixed",
  );
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
  const activeScope: ExpenseScope = "general";
  const filteredExpenses = useMemo(
    () =>
      filterExpenses(expenses, {
        monthId: effectiveMonthId,
        category,
        allocationMethod,
        search,
      }),
    [allocationMethod, category, effectiveMonthId, expenses, search],
  );
  const summary = useMemo(() => getExpensesSummary(filteredExpenses), [filteredExpenses]);
  const selectedAllocationPreview = allocationPreview[effectiveMonthId] ?? {
    projectTotals: [],
    warnings: [],
  };
  const canMutateExpenses =
    canManageExpenses && expensesFeatureAvailable && !selectedMonthLocked;

  function handleSuccess() {
    setShowForm(false);
    setEditingExpense(null);
    router.refresh();
  }

  function handleSectionChange(section: ExpensesSection) {
    setActiveSection(section);
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
            Διαχείριση υλικών, γενικών εξόδων και μελλοντικά πάγιων εξόδων.
          </p>
        </div>
        {activeSection === "general" && canMutateExpenses ? (
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

      {activeSection === "general" && !expensesFeatureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Έξοδα.
        </section>
      ) : null}

      {activeSection === "general" && selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      <ExpensesSectionTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        showMaterials={canShowMaterials}
        showGeneral={canShowGeneral}
      />

      {activeSection === "materials" ? (
        <MaterialsPageClient
          materials={materials}
          suppliers={suppliers}
          monthlyPeriods={monthlyPeriods}
          projects={projects}
          canManage={canManageMaterials}
          canCreateSuppliers={canManageExpenses}
          featureAvailable={materialsFeatureAvailable}
          defaultMonthId={defaultMonthId}
        />
      ) : null}

      {activeSection === "general" ? (
        <div className="space-y-5">
          <ExpensesSummaryCards summary={summary} />
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

          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-950">
              {expenseScopeLabels.general}
            </h3>
          </div>

          {(showForm || editingExpense) && canMutateExpenses ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ExpenseForm
                action={editingExpense ? updateExpense : createExpense}
                expense={editingExpense ?? undefined}
                monthlyPeriods={openMonthlyPeriods}
                offices={offices}
                vehicles={vehicles}
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
            canManage={canMutateExpenses}
            lockedMonthIds={lockedMonthIds}
            onEditExpense={(expense) => {
              setShowForm(false);
              setEditingExpense(expense);
            }}
          />

          <ExpenseAllocationPreview preview={selectedAllocationPreview} />
        </div>
      ) : null}

      {activeSection === "fixed" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-blue-700">Πάγια έξοδα</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Προσεχώς διαθέσιμο
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Η διαχείριση πάγιων εξόδων θα προστεθεί σε επόμενο βήμα.
          </p>
        </section>
      ) : null}
    </div>
  );
}
