import { createClient } from "@/src/integrations/supabase/server";
import { calculateProjectQuoteTotals } from "@/src/features/projects/services/calculate-project-quote-totals";
import type {
  EmployeeAmountRow,
  ExpenseAllocationRow,
  IkaAmountRow,
  MaterialCostRow,
  ProjectSummaryReport,
  ProjectSummaryRow,
  ProjectSummaryTotals,
  RevenueSummaryRow,
  SubcontractorContractCostRow,
  WorkUnitRow,
} from "../types";
import { calculateExpenseAllocations } from "./calculate-expense-allocations";
import { calculateIkaAllocations } from "./calculate-ika-allocations";
import { calculatePaymentAllocations } from "./calculate-payment-allocations";
import { calculateRevenueSummary } from "./calculate-revenue-summary";
import {
  addCostBreakdown,
  calculateTotalCost,
  emptyCostBreakdown,
} from "./calculate-cost-breakdown";

type ProjectRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  budget_amount: number | null;
};

type EmployeeRow = {
  id: string;
  full_name: string;
};

type ProjectQuoteRow = {
  project_id: string;
  status: string;
  amount: number | null;
  vat_amount: number | null;
  total_amount: number | null;
};

function projectStatus({
  profit,
  invoicedRevenue,
  totalCost,
  margin,
}: {
  profit: number;
  invoicedRevenue: number;
  totalCost: number;
  margin: number | null;
}): ProjectSummaryRow["status"] {
  if (profit < 0) return "loss";
  if (invoicedRevenue === 0 && totalCost > 0) return "no_revenue";
  if (margin !== null && margin < 0.1) return "low_margin";
  return "healthy";
}

export async function getProjectSummary(
  companyId: string,
  monthId: string,
): Promise<ProjectSummaryReport> {
  if (!monthId) {
    return {
      monthId,
      projects: [],
      totals: {
        invoicedRevenue: 0,
        receivedRevenue: 0,
        remainingRevenue: 0,
        totalCost: 0,
        profit: 0,
        margin: null,
        costs: emptyCostBreakdown(),
      },
      warnings: [],
    };
  }

  const supabase = await createClient();
  const [
    projectsResult,
    employeesResult,
    workResult,
    paymentsResult,
    ikaResult,
    materialsResult,
    subcontractorContractsResult,
    expensesResult,
    revenuesResult,
    quotesResult,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, code, name, status, budget_amount")
      .eq("company_id", companyId),
    supabase.from("employees").select("id, full_name").eq("company_id", companyId),
    supabase
      .from("daily_work_entries")
      .select("employee_id, project_id, hours, overtime_hours, expense_amount")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("employee_payments")
      .select("employee_id, amount")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("employee_ika")
      .select("employee_id, ika_amount")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("materials")
      .select("project_id, total_amount")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("employee_project_contracts")
      .select("project_id, contract_amount")
      .eq("company_id", companyId)
      .in("status", ["active", "completed"]),
    supabase
      .from("expenses")
      .select("id, amount, allocation_method, description")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("revenues")
      .select("project_id, revenue_type, invoiced_amount, received_amount, remaining_amount, status")
      .eq("company_id", companyId)
      .eq("month_id", monthId),
    supabase
      .from("project_quotes")
      .select("project_id, status, amount, vat_amount, total_amount")
      .eq("company_id", companyId),
  ]);

  const firstError =
    projectsResult.error ??
    employeesResult.error ??
    workResult.error ??
    paymentsResult.error ??
    ikaResult.error ??
    materialsResult.error ??
    subcontractorContractsResult.error ??
    expensesResult.error ??
    revenuesResult.error ??
    quotesResult.error;

  if (firstError) {
    console.error("[project-summary:getProjectSummary] Supabase error", {
      message: firstError.message,
      code: firstError.code,
      details: firstError.details,
      hint: firstError.hint,
    });
    throw new Error("Unable to load project summary.");
  }

  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const employees = (employeesResult.data ?? []) as EmployeeRow[];
  const workRows = (workResult.data ?? []) as WorkUnitRow[];
  const payments = (paymentsResult.data ?? []) as EmployeeAmountRow[];
  const ikaRows = (ikaResult.data ?? []) as IkaAmountRow[];
  const materials = (materialsResult.data ?? []) as MaterialCostRow[];
  const subcontractorContracts =
    (subcontractorContractsResult.data ?? []) as SubcontractorContractCostRow[];
  const expenses = (expensesResult.data ?? []) as ExpenseAllocationRow[];
  const revenues = (revenuesResult.data ?? []) as RevenueSummaryRow[];
  const quotes = (quotesResult.data ?? []) as ProjectQuoteRow[];
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.full_name]));
  // Stored "active" projects represent the offer stage in the Projects UI.
  // Only in-progress projects participate in active-project allocations.
  const activeProjects = projects.filter(
    (project) => project.status === "in_progress",
  );

  const revenuesByProject = calculateRevenueSummary(revenues);
  const paymentResult = calculatePaymentAllocations({
    payments,
    workRows,
    employeeNames,
  });
  const ikaAllocationResult = calculateIkaAllocations({ ikaRows, workRows, employeeNames });
  const expenseResult = calculateExpenseAllocations({
    expenses,
    workRows,
    activeProjects,
    revenuesByProject,
  });

  const workByProject = new Map<
    string,
    { hours: number; overtimeHours: number; employeeExpenses: number; workUnits: number }
  >();
  for (const row of workRows) {
    const existing = workByProject.get(row.project_id) ?? {
      hours: 0,
      overtimeHours: 0,
      employeeExpenses: 0,
      workUnits: 0,
    };
    existing.hours += Number(row.hours);
    existing.overtimeHours += Number(row.overtime_hours);
    existing.employeeExpenses += Number(row.expense_amount);
    existing.workUnits += Number(row.hours) + Number(row.overtime_hours);
    workByProject.set(row.project_id, existing);
  }

  const materialsByProject = new Map<string, number>();
  for (const row of materials) {
    materialsByProject.set(
      row.project_id,
      (materialsByProject.get(row.project_id) ?? 0) + Number(row.total_amount),
    );
  }

  const subcontractorContractsByProject = new Map<string, number>();
  for (const row of subcontractorContracts) {
    subcontractorContractsByProject.set(
      row.project_id,
      (subcontractorContractsByProject.get(row.project_id) ?? 0) +
        Number(row.contract_amount),
    );
  }

  const quotesByProject = new Map<string, ProjectQuoteRow[]>();
  for (const quote of quotes) {
    quotesByProject.set(quote.project_id, [
      ...(quotesByProject.get(quote.project_id) ?? []),
      quote,
    ]);
  }

  const relevantProjectIds = new Set([
    ...projects.map((project) => project.id),
    ...workByProject.keys(),
    ...paymentResult.allocations.keys(),
    ...ikaAllocationResult.allocations.keys(),
    ...materialsByProject.keys(),
    ...subcontractorContractsByProject.keys(),
    ...expenseResult.allocations.keys(),
    ...revenuesByProject.keys(),
    ...quotesByProject.keys(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  const rows: ProjectSummaryRow[] = Array.from(relevantProjectIds).map((projectId) => {
    const project = projectMap.get(projectId);
    const work = workByProject.get(projectId) ?? {
      hours: 0,
      overtimeHours: 0,
      employeeExpenses: 0,
      workUnits: 0,
    };
    const revenue = revenuesByProject.get(projectId) ?? {
      invoicedRevenue: 0,
      receivedRevenue: 0,
      remainingRevenue: 0,
    };
    const costs = {
      employeeExpenses: work.employeeExpenses,
      allocatedPayments: paymentResult.allocations.get(projectId) ?? 0,
      allocatedIka: ikaAllocationResult.allocations.get(projectId) ?? 0,
      materialsCost: materialsByProject.get(projectId) ?? 0,
      subcontractorContracts: subcontractorContractsByProject.get(projectId) ?? 0,
      allocatedExpenses: expenseResult.allocations.get(projectId) ?? 0,
    };
    const totalCost = calculateTotalCost(costs);
    const profit = revenue.invoicedRevenue - totalCost;
    const margin = revenue.invoicedRevenue > 0 ? profit / revenue.invoicedRevenue : null;
    const quoteTotals = calculateProjectQuoteTotals(
      project?.budget_amount ?? null,
      quotesByProject.get(projectId) ?? [],
    );

    return {
      projectId,
      projectCode: project?.code ?? "-",
      projectName: project?.name ?? "-",
      hours: work.hours,
      overtimeHours: work.overtimeHours,
      workUnits: work.workUnits,
      invoicedRevenue: revenue.invoicedRevenue,
      receivedRevenue: revenue.receivedRevenue,
      remainingRevenue: revenue.remainingRevenue,
      totalCost,
      profit,
      margin,
      costs,
      quoteTotals,
      status: projectStatus({
        profit,
        invoicedRevenue: revenue.invoicedRevenue,
        totalCost,
        margin,
      }),
    };
  });

  const totals = rows.reduce<ProjectSummaryTotals>(
    (summary, row) => ({
      invoicedRevenue: summary.invoicedRevenue + row.invoicedRevenue,
      receivedRevenue: summary.receivedRevenue + row.receivedRevenue,
      remainingRevenue: summary.remainingRevenue + row.remainingRevenue,
      totalCost: summary.totalCost + row.totalCost,
      profit: summary.profit + row.profit,
      margin: null,
      costs: addCostBreakdown(summary.costs, row.costs),
    }),
    {
      invoicedRevenue: 0,
      receivedRevenue: 0,
      remainingRevenue: 0,
      totalCost: 0,
      profit: 0,
      margin: null,
      costs: emptyCostBreakdown(),
    },
  );
  totals.margin = totals.invoicedRevenue > 0 ? totals.profit / totals.invoicedRevenue : null;

  return {
    monthId,
    projects: rows.sort((a, b) => b.totalCost - a.totalCost),
    totals,
    warnings: [
      ...paymentResult.warnings,
      ...ikaAllocationResult.warnings,
      ...expenseResult.warnings,
    ],
  };
}
