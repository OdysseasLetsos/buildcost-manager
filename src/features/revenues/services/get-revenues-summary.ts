import type { RevenuesSummary, RevenueWithRelations } from "../types";

export function getRevenuesSummary(revenues: RevenueWithRelations[]): RevenuesSummary {
  return revenues.reduce<RevenuesSummary>(
    (summary, revenue) => {
      if (revenue.status === "cancelled") return summary;

      if (revenue.revenue_type === "credit") {
        summary.invoicedAmount -= revenue.invoiced_amount;
        summary.receivedAmount -= revenue.received_amount;
        summary.totalRevenue -= revenue.received_amount;
        return summary;
      }

      if (revenue.revenue_type === "invoice") {
        summary.invoicedAmount += revenue.invoiced_amount;
        summary.remainingAmount += revenue.remaining_amount;
      }

      summary.receivedAmount += revenue.received_amount;
      summary.totalRevenue += revenue.received_amount;
      return summary;
    },
    {
      invoicedAmount: 0,
      receivedAmount: 0,
      remainingAmount: 0,
      totalRevenue: 0,
    },
  );
}
