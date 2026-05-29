import type { ProjectSummaryCostBreakdown } from "../types";

export function emptyCostBreakdown(): ProjectSummaryCostBreakdown {
  return {
    employeeExpenses: 0,
    allocatedPayments: 0,
    allocatedIka: 0,
    materialsCost: 0,
    allocatedExpenses: 0,
  };
}

export function calculateTotalCost(costs: ProjectSummaryCostBreakdown): number {
  return (
    costs.employeeExpenses +
    costs.allocatedPayments +
    costs.allocatedIka +
    costs.materialsCost +
    costs.allocatedExpenses
  );
}

export function addCostBreakdown(
  left: ProjectSummaryCostBreakdown,
  right: ProjectSummaryCostBreakdown,
): ProjectSummaryCostBreakdown {
  return {
    employeeExpenses: left.employeeExpenses + right.employeeExpenses,
    allocatedPayments: left.allocatedPayments + right.allocatedPayments,
    allocatedIka: left.allocatedIka + right.allocatedIka,
    materialsCost: left.materialsCost + right.materialsCost,
    allocatedExpenses: left.allocatedExpenses + right.allocatedExpenses,
  };
}
