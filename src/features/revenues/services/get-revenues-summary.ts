import type { RevenuesSummary, RevenueWithRelations } from "../types";

export function getRevenuesSummary(revenues: RevenueWithRelations[]): RevenuesSummary {
  return revenues.reduce<RevenuesSummary>(
    (summary, revenue) => {
      if (revenue.status === "cancelled") return summary;

      const invoicedAmount = Number(revenue.invoiced_amount ?? 0);
      const receivedAmount = Number(revenue.received_amount ?? 0);
      const remainingAmount = Number(revenue.remaining_amount ?? 0);

      if (revenue.revenue_type === "credit") {
        summary.invoicedAmount -= invoicedAmount;
        summary.receivedAmount -= receivedAmount;
        summary.totalRevenue -= receivedAmount;
        return summary;
      }

      if (revenue.revenue_type === "invoice") {
        summary.invoicedAmount += invoicedAmount;
        summary.remainingAmount += remainingAmount;
      }

      summary.receivedAmount += receivedAmount;
      summary.totalRevenue += receivedAmount;
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
