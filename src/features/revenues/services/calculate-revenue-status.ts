import type { RevenueStatus, RevenueType } from "../constants";

export type NormalizedRevenueAmounts = {
  invoicedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  status: RevenueStatus;
};

export function calculateRevenueStatus(input: {
  revenueType: RevenueType;
  invoicedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  status: RevenueStatus;
}): NormalizedRevenueAmounts {
  const forcedCancelled = input.status === "cancelled";

  if (input.revenueType !== "credit") {
    const remainingAmount = Math.max(
      input.invoicedAmount - input.receivedAmount,
      0,
    );
    let status: RevenueStatus = "pending";

    if (remainingAmount === 0 && input.invoicedAmount > 0) status = "paid";
    else if (input.receivedAmount > 0 && remainingAmount > 0) status = "partial";

    return {
      invoicedAmount: input.invoicedAmount,
      receivedAmount: input.receivedAmount,
      remainingAmount,
      status: forcedCancelled ? "cancelled" : status,
    };
  }

  return {
    invoicedAmount: input.invoicedAmount,
    receivedAmount: input.receivedAmount,
    remainingAmount: 0,
    status: forcedCancelled ? "cancelled" : "paid",
  };
}
