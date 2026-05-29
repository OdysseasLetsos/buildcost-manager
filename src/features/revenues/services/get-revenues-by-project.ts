import type { RevenuesByProjectTotal, RevenueWithRelations } from "../types";

export function getRevenuesByProject(
  revenues: RevenueWithRelations[],
): RevenuesByProjectTotal[] {
  const totals = new Map<
    string,
    Omit<RevenuesByProjectTotal, "percentage">
  >();

  for (const revenue of revenues) {
    if (revenue.status === "cancelled") continue;

    const existing = totals.get(revenue.project_id) ?? {
      projectId: revenue.project_id,
      projectCode: revenue.projectCode,
      projectName: revenue.projectName,
      invoicedAmount: 0,
      receivedAmount: 0,
      remainingAmount: 0,
    };
    const sign = revenue.revenue_type === "credit" ? -1 : 1;

    if (revenue.revenue_type === "invoice" || revenue.revenue_type === "credit") {
      existing.invoicedAmount += sign * revenue.invoiced_amount;
    }
    existing.receivedAmount += sign * revenue.received_amount;
    if (revenue.revenue_type === "invoice") {
      existing.remainingAmount += revenue.remaining_amount;
    }
    totals.set(revenue.project_id, existing);
  }

  const totalReceived = Array.from(totals.values()).reduce(
    (sum, total) => sum + total.receivedAmount,
    0,
  );

  return Array.from(totals.values())
    .map((total) => ({
      ...total,
      percentage: totalReceived > 0 ? (total.receivedAmount / totalReceived) * 100 : 0,
    }))
    .sort((a, b) => b.receivedAmount - a.receivedAmount);
}
