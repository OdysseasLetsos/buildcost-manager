import type { RevenueSummaryRow } from "../types";

export type ProjectRevenueTotals = {
  invoicedRevenue: number;
  receivedRevenue: number;
  remainingRevenue: number;
};

export function calculateRevenueSummary(revenueRows: RevenueSummaryRow[]) {
  const revenuesByProject = new Map<string, ProjectRevenueTotals>();

  for (const revenue of revenueRows) {
    if (revenue.status === "cancelled") continue;

    const existing = revenuesByProject.get(revenue.project_id) ?? {
      invoicedRevenue: 0,
      receivedRevenue: 0,
      remainingRevenue: 0,
    };

    if (revenue.revenue_type === "credit") {
      existing.invoicedRevenue -= Number(revenue.invoiced_amount);
      existing.receivedRevenue -= Number(revenue.received_amount);
      revenuesByProject.set(revenue.project_id, existing);
      continue;
    }

    if (revenue.revenue_type === "invoice") {
      existing.invoicedRevenue += Number(revenue.invoiced_amount);
      existing.remainingRevenue += Number(revenue.remaining_amount);
    }

    existing.receivedRevenue += Number(revenue.received_amount);
    revenuesByProject.set(revenue.project_id, existing);
  }

  return revenuesByProject;
}
