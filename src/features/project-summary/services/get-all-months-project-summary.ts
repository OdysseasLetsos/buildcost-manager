import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type {
  ProjectSummaryReport,
  ProjectSummaryRow,
  ProjectSummaryStatus,
  ProjectSummaryTotals,
} from "../types";
import {
  addCostBreakdown,
  calculateTotalCost,
  emptyCostBreakdown,
} from "./calculate-cost-breakdown";
import { getProjectSummary } from "./get-project-summary";
import { mergeSupplierOutstandingBalances } from "./get-supplier-outstanding-balances";

function getSummaryStatus({
  profit,
  invoicedRevenue,
  totalCost,
  margin,
}: {
  profit: number;
  invoicedRevenue: number;
  totalCost: number;
  margin: number | null;
}): ProjectSummaryStatus {
  if (profit < 0) return "loss";
  if (invoicedRevenue === 0 && totalCost > 0) return "no_revenue";
  if (margin !== null && margin < 0.1) return "low_margin";
  return "healthy";
}

function emptyTotals(): ProjectSummaryTotals {
  return {
    invoicedRevenue: 0,
    receivedRevenue: 0,
    remainingRevenue: 0,
    totalCost: 0,
    profit: 0,
    margin: null,
    costs: emptyCostBreakdown(),
  };
}

function finalizeProject(project: ProjectSummaryRow): ProjectSummaryRow {
  const totalCost = calculateTotalCost(project.costs);
  const profit = project.invoicedRevenue - totalCost;
  const margin = project.invoicedRevenue > 0 ? profit / project.invoicedRevenue : null;

  return {
    ...project,
    totalCost,
    profit,
    margin,
    status: getSummaryStatus({
      profit,
      invoicedRevenue: project.invoicedRevenue,
      totalCost,
      margin,
    }),
    quoteTotals: { ...project.quoteTotals },
  };
}

function addProjectRow(
  existingProject: ProjectSummaryRow | undefined,
  nextProject: ProjectSummaryRow,
): ProjectSummaryRow {
  if (!existingProject) {
    return { ...nextProject, costs: { ...nextProject.costs } };
  }

  const costs = addCostBreakdown(existingProject.costs, nextProject.costs);
  // Subcontractor contracts are project-level committed costs, not monthly entries.
  // Keep them once in all-months aggregation instead of adding the same contract
  // amount once per month.
  costs.subcontractorContracts = Math.max(
    existingProject.costs.subcontractorContracts,
    nextProject.costs.subcontractorContracts,
  );

  return {
    ...existingProject,
    hours: existingProject.hours + nextProject.hours,
    overtimeHours: existingProject.overtimeHours + nextProject.overtimeHours,
    workUnits: existingProject.workUnits + nextProject.workUnits,
    invoicedRevenue:
      existingProject.invoicedRevenue + nextProject.invoicedRevenue,
    receivedRevenue:
      existingProject.receivedRevenue + nextProject.receivedRevenue,
    remainingRevenue:
      existingProject.remainingRevenue + nextProject.remainingRevenue,
    totalCost: existingProject.totalCost + nextProject.totalCost,
    profit: existingProject.profit + nextProject.profit,
    costs,
    quoteTotals: { ...existingProject.quoteTotals },
  };
}

function totalsForProjects(projects: ProjectSummaryRow[]): ProjectSummaryTotals {
  const totals = projects.reduce<ProjectSummaryTotals>(
    (summary, project) => ({
      invoicedRevenue: summary.invoicedRevenue + project.invoicedRevenue,
      receivedRevenue: summary.receivedRevenue + project.receivedRevenue,
      remainingRevenue: summary.remainingRevenue + project.remainingRevenue,
      totalCost: summary.totalCost + project.totalCost,
      profit: summary.profit + project.profit,
      margin: null,
      costs: addCostBreakdown(summary.costs, project.costs),
    }),
    emptyTotals(),
  );

  totals.totalCost = calculateTotalCost(totals.costs);
  totals.profit = totals.invoicedRevenue - totals.totalCost;
  totals.margin = totals.invoicedRevenue > 0 ? totals.profit / totals.invoicedRevenue : null;

  return totals;
}

export async function getAllMonthsProjectSummary(
  companyId: string,
  monthlyPeriods: MonthlyPeriod[],
): Promise<ProjectSummaryReport> {
  const monthlyReports = await Promise.all(
    monthlyPeriods.map((period) => getProjectSummary(companyId, period.id)),
  );
  const projectsById = new Map<string, ProjectSummaryRow>();

  for (const report of monthlyReports) {
    for (const project of report.projects) {
      projectsById.set(
        project.projectId,
        addProjectRow(projectsById.get(project.projectId), project),
      );
    }
  }

  const projects = Array.from(projectsById.values())
    .map(finalizeProject)
    .sort((a, b) => b.totalCost - a.totalCost);

  return {
    monthId: "all",
    projects,
    totals: totalsForProjects(projects),
    warnings: monthlyReports.flatMap((report) => report.warnings),
    supplierOutstandingBalances: mergeSupplierOutstandingBalances(
      monthlyReports.map((report) => report.supplierOutstandingBalances),
    ),
  };
}
