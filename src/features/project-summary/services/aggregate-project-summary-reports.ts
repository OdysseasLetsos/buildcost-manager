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

function getProjectStatus({
  invoicedRevenue,
  profit,
  margin,
  totalCost,
}: {
  invoicedRevenue: number;
  profit: number;
  margin: number | null;
  totalCost: number;
}): ProjectSummaryStatus {
  if (profit < 0) return "loss";
  if (invoicedRevenue === 0 && totalCost > 0) return "no_revenue";
  if (margin !== null && margin < 0.1) return "low_margin";
  return "healthy";
}

export function getEmptyProjectSummaryReport(monthId = ""): ProjectSummaryReport {
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

export function getProjectSummaryTotals(
  projects: ProjectSummaryReport["projects"],
): ProjectSummaryTotals {
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
    getEmptyProjectSummaryReport().totals,
  );

  totals.totalCost = calculateTotalCost(totals.costs);
  totals.profit = totals.invoicedRevenue - totals.totalCost;
  totals.margin = totals.invoicedRevenue > 0 ? totals.profit / totals.invoicedRevenue : null;
  return totals;
}

function mergeProjectRows(rows: ProjectSummaryRow[]): ProjectSummaryRow {
  const firstRow = rows[0];
  const mergedCosts = rows.reduce(
    (costs, row) => addCostBreakdown(costs, row.costs),
    emptyCostBreakdown(),
  );
  const totalCost = calculateTotalCost(mergedCosts);
  const invoicedRevenue = rows.reduce((sum, row) => sum + row.invoicedRevenue, 0);
  const profit = invoicedRevenue - totalCost;
  const margin = invoicedRevenue > 0 ? profit / invoicedRevenue : null;

  return {
    projectId: firstRow.projectId,
    projectCode: firstRow.projectCode,
    projectName: firstRow.projectName,
    status: getProjectStatus({ invoicedRevenue, profit, margin, totalCost }),
    hours: rows.reduce((sum, row) => sum + row.hours, 0),
    overtimeHours: rows.reduce((sum, row) => sum + row.overtimeHours, 0),
    workUnits: rows.reduce((sum, row) => sum + row.workUnits, 0),
    invoicedRevenue,
    receivedRevenue: rows.reduce((sum, row) => sum + row.receivedRevenue, 0),
    remainingRevenue: rows.reduce((sum, row) => sum + row.remainingRevenue, 0),
    totalCost,
    profit,
    margin,
    costs: mergedCosts,
  };
}

export function aggregateProjectSummaryReports(
  reports: ProjectSummaryReport[],
): ProjectSummaryReport {
  const rowsByProject = new Map<string, ProjectSummaryRow[]>();

  for (const report of reports) {
    for (const project of report.projects) {
      rowsByProject.set(project.projectId, [
        ...(rowsByProject.get(project.projectId) ?? []),
        project,
      ]);
    }
  }

  const projects = Array.from(rowsByProject.values())
    .map(mergeProjectRows)
    .sort((left, right) => left.projectCode.localeCompare(right.projectCode, "el-GR"));

  return {
    monthId: reports.map((report) => report.monthId).join(","),
    projects,
    totals: getProjectSummaryTotals(projects),
    warnings: reports.flatMap((report) => report.warnings),
  };
}
