import type { DashboardMonthlyPeriod } from "../types";
import type {
  DashboardFinancials,
  DashboardMonthlyFinancialTotal,
} from "../types";
import { getProjectSummary } from "@/src/features/project-summary/services/get-project-summary";

export async function getDashboardFinancials(
  companyId: string,
  selectedMonth: DashboardMonthlyPeriod | null,
): Promise<DashboardFinancials | null> {
  if (!selectedMonth) return null;

  const report = await getProjectSummary(companyId, selectedMonth.id);

  return {
    monthId: selectedMonth.id,
    monthKey: selectedMonth.month_key,
    invoicedRevenue: report.totals.invoicedRevenue,
    receivedRevenue: report.totals.receivedRevenue,
    remainingRevenue: report.totals.remainingRevenue,
    totalCost: report.totals.totalCost,
    paymentsCost: report.totals.costs.allocatedPayments,
    ikaCost: report.totals.costs.allocatedIka,
    materialsCost: report.totals.costs.materialsCost,
    allocatedExpenses: report.totals.costs.allocatedExpenses,
    employeeExpenses: report.totals.costs.employeeExpenses,
    profit: report.totals.profit,
    margin: report.totals.margin,
    projects: report.projects.map((project) => ({
      projectId: project.projectId,
      revenue: project.invoicedRevenue,
      receivedRevenue: project.receivedRevenue,
      remainingRevenue: project.remainingRevenue,
      totalCost: project.totalCost,
      profit: project.profit,
      margin: project.margin,
      status: project.status,
    })),
  };
}

export async function getDashboardMonthlyFinancials(
  companyId: string,
  monthlyPeriods: DashboardMonthlyPeriod[],
): Promise<DashboardMonthlyFinancialTotal[]> {
  const periods = monthlyPeriods.slice(0, 6).reverse();
  const reports = await Promise.all(
    periods.map(async (period) => {
      const report = await getProjectSummary(companyId, period.id);
      return {
        monthId: period.id,
        monthKey: period.month_key,
        revenue: report.totals.invoicedRevenue,
        cost: report.totals.totalCost,
        profit: report.totals.profit,
        margin: report.totals.margin,
      };
    }),
  );

  return reports;
}
