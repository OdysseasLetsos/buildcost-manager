import type {
  ExpenseAllocationRow,
  ProjectSummaryWarning,
  WorkUnitRow,
} from "../types";
import type { ProjectRevenueTotals } from "./calculate-revenue-summary";

type ActiveProject = {
  id: string;
};

export function calculateExpenseAllocations({
  expenses,
  workRows,
  activeProjects,
  revenuesByProject,
}: {
  expenses: ExpenseAllocationRow[];
  workRows: WorkUnitRow[];
  activeProjects: ActiveProject[];
  revenuesByProject: Map<string, ProjectRevenueTotals>;
}) {
  const allocations = new Map<string, number>();
  const warnings: ProjectSummaryWarning[] = [];
  const workUnitsByProject = new Map<string, number>();

  for (const row of workRows) {
    const workUnits = Number(row.hours) + Number(row.overtime_hours);
    workUnitsByProject.set(
      row.project_id,
      (workUnitsByProject.get(row.project_id) ?? 0) + workUnits,
    );
  }

  const totalWorkUnits = Array.from(workUnitsByProject.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalInvoicedRevenue = Array.from(revenuesByProject.values()).reduce(
    (sum, value) => sum + value.invoicedRevenue,
    0,
  );

  function addAllocation(projectId: string, amount: number) {
    allocations.set(projectId, (allocations.get(projectId) ?? 0) + amount);
  }

  for (const expense of expenses) {
    const amount = Number(expense.amount);

    if (expense.allocation_method === "by_project_hours") {
      if (totalWorkUnits <= 0) {
        warnings.push({
          type: "expenses",
          entityName: expense.description ?? "Έξοδο",
          amount,
          message:
            "Δεν μπορεί να γίνει κατανομή εξόδων με βάση ώρες γιατί δεν υπάρχουν ώρες εργασίας.",
        });
        continue;
      }

      for (const [projectId, workUnits] of workUnitsByProject) {
        addAllocation(projectId, (amount * workUnits) / totalWorkUnits);
      }
      continue;
    }

    if (expense.allocation_method === "equal_per_active_project") {
      if (activeProjects.length === 0) continue;
      const amountPerProject = amount / activeProjects.length;
      for (const project of activeProjects) addAllocation(project.id, amountPerProject);
      continue;
    }

    if (expense.allocation_method === "by_project_revenue") {
      if (totalInvoicedRevenue <= 0) {
        warnings.push({
          type: "expenses",
          entityName: expense.description ?? "Έξοδο",
          amount,
          message:
            "Δεν μπορεί να γίνει κατανομή εξόδων με βάση έσοδα γιατί δεν υπάρχουν τιμολογηθέντα έσοδα.",
        });
        continue;
      }

      for (const [projectId, revenueTotals] of revenuesByProject) {
        if (revenueTotals.invoicedRevenue <= 0) continue;
        addAllocation(projectId, (amount * revenueTotals.invoicedRevenue) / totalInvoicedRevenue);
      }
      continue;
    }

    warnings.push({
      type: "expenses",
      entityName: expense.description ?? "Έξοδο",
      amount,
      message: "Υπάρχουν έξοδα με χειροκίνητη κατανομή που δεν έχουν κατανεμηθεί.",
    });
  }

  return { allocations, warnings };
}
