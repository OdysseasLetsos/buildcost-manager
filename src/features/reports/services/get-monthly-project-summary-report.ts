import { getProjectSummary } from "@/src/features/project-summary/services/get-project-summary";
import type {
  ProjectSummaryReport,
  ProjectSummaryRow,
} from "@/src/features/project-summary/types";
import { requireReportsAccess } from "./require-reports-access";

export async function getMonthlyProjectSummaryReport({
  companyId,
  monthId,
  projectId,
}: {
  companyId: string;
  monthId: string;
  projectId?: string;
}): Promise<ProjectSummaryReport> {
  await requireReportsAccess(companyId);
  const report = await getProjectSummary(companyId, monthId);

  if (!projectId) {
    return report;
  }

  const projects = report.projects.filter(
    (project: ProjectSummaryRow) => project.projectId === projectId,
  );

  return {
    ...report,
    projects,
    totals: projects.reduce(
      (totals, project) => {
        totals.invoicedRevenue += project.invoicedRevenue;
        totals.receivedRevenue += project.receivedRevenue;
        totals.remainingRevenue += project.remainingRevenue;
        totals.totalCost += project.totalCost;
        totals.profit += project.profit;
        totals.costs.employeeExpenses += project.costs.employeeExpenses;
        totals.costs.allocatedPayments += project.costs.allocatedPayments;
        totals.costs.allocatedIka += project.costs.allocatedIka;
        totals.costs.materialsCost += project.costs.materialsCost;
        totals.costs.subcontractorContracts += project.costs.subcontractorContracts;
        totals.costs.allocatedExpenses += project.costs.allocatedExpenses;
        return totals;
      },
      {
        invoicedRevenue: 0,
        receivedRevenue: 0,
        remainingRevenue: 0,
        totalCost: 0,
        profit: 0,
        margin: null,
        costs: {
          employeeExpenses: 0,
          allocatedPayments: 0,
          allocatedIka: 0,
          materialsCost: 0,
          subcontractorContracts: 0,
          allocatedExpenses: 0,
        },
      },
    ),
  };
}
