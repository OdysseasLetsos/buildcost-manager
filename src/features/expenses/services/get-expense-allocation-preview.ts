import { createClient } from "@/src/integrations/supabase/server";
import type {
  Expense,
  ExpenseAllocationPreview,
  ExpenseAllocationProjectTotal,
} from "../types";

type WorkRow = {
  project_id: string;
  hours: number;
  overtime_hours: number;
};

type ProjectRow = {
  id: string;
  code: string;
  name: string;
  status: string;
};

function emptyPreview(warnings: ExpenseAllocationPreview["warnings"]): ExpenseAllocationPreview {
  return { projectTotals: [], warnings };
}

export async function getExpenseAllocationPreview(
  companyId: string,
  monthId: string,
): Promise<ExpenseAllocationPreview> {
  if (!monthId) return emptyPreview([]);

  const supabase = await createClient();
  const [expensesResult, workResult, projectsResult] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("daily_work_entries")
      .select("project_id, hours, overtime_hours")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("projects")
      .select("id, code, name, status")
      .eq("company_id", companyId),
  ]);

  if (expensesResult.error || workResult.error || projectsResult.error) {
    console.error("[expenses:getExpenseAllocationPreview] Supabase error", {
      expensesError: expensesResult.error?.message,
      workError: workResult.error?.message,
      projectsError: projectsResult.error?.message,
    });
    throw new Error("Unable to load expense allocation preview.");
  }

  const expenses = (expensesResult.data ?? []) as Expense[];
  const workRows = (workResult.data ?? []) as WorkRow[];
  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const activeProjects = projects.filter((project) =>
    ["active", "in_progress"].includes(project.status),
  );
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
  const projectTotals = new Map<string, { allocatedAmount: number; basis: number }>();
  const warnings: ExpenseAllocationPreview["warnings"] = [];

  function addProjectTotal(projectId: string, amount: number, basis: number) {
    const existing = projectTotals.get(projectId) ?? { allocatedAmount: 0, basis: 0 };
    existing.allocatedAmount += amount;
    existing.basis += basis;
    projectTotals.set(projectId, existing);
  }

  for (const expense of expenses) {
    const description = expense.description || expense.category;

    if (expense.allocation_method === "by_project_hours") {
      if (totalWorkUnits <= 0) {
        warnings.push({
          expenseId: expense.id,
          description,
          amount: expense.amount,
          message:
            "Δεν μπορεί να γίνει κατανομή με βάση ώρες γιατί δεν υπάρχουν ώρες εργασίας.",
        });
        continue;
      }

      for (const [projectId, workUnits] of workUnitsByProject) {
        addProjectTotal(projectId, (expense.amount * workUnits) / totalWorkUnits, workUnits);
      }
      continue;
    }

    if (expense.allocation_method === "equal_per_active_project") {
      if (activeProjects.length === 0) {
        warnings.push({
          expenseId: expense.id,
          description,
          amount: expense.amount,
          message: "Δεν υπάρχουν ενεργά έργα για ισόποση κατανομή.",
        });
        continue;
      }

      const amountPerProject = expense.amount / activeProjects.length;
      for (const project of activeProjects) {
        addProjectTotal(project.id, amountPerProject, 1);
      }
      continue;
    }

    warnings.push({
      expenseId: expense.id,
      description,
      amount: expense.amount,
      message:
        expense.allocation_method === "by_project_revenue"
          ? "Η κατανομή με βάση τα έσοδα θα ενεργοποιηθεί μετά το Revenues module."
          : "Η χειροκίνητη κατανομή θα υποστηριχθεί σε επόμενη έκδοση.",
    });
  }

  const allocatedTotal = Array.from(projectTotals.values()).reduce(
    (sum, total) => sum + total.allocatedAmount,
    0,
  );

  const totals: ExpenseAllocationProjectTotal[] = Array.from(projectTotals.entries())
    .map(([projectId, total]) => {
      const project = projectMap.get(projectId);
      return {
        projectId,
        projectCode: project?.code ?? "-",
        projectName: project?.name ?? "-",
        allocatedAmount: total.allocatedAmount,
        basis: total.basis,
        percentage:
          allocatedTotal > 0 ? (total.allocatedAmount / allocatedTotal) * 100 : 0,
      };
    })
    .sort((a, b) => b.allocatedAmount - a.allocatedAmount);

  return { projectTotals: totals, warnings };
}
