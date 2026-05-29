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
  if (input.status === "cancelled") {
    return {
      invoicedAmount: input.invoicedAmount,
      receivedAmount: input.receivedAmount,
      remainingAmount: input.remainingAmount,
      status: "cancelled",
    };
  }

  if (input.revenueType === "invoice") {
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
      status,
    };
  }

  if (input.revenueType === "advance") {
    return {
      invoicedAmount: input.invoicedAmount,
      receivedAmount: input.receivedAmount,
      remainingAmount: 0,
      status: "paid",
    };
  }

  if (input.revenueType === "payment") {
    return {
      invoicedAmount: input.invoicedAmount,
      receivedAmount: input.receivedAmount,
      remainingAmount: input.remainingAmount,
      status: input.remainingAmount > 0 ? "partial" : "paid",
    };
  }

  return {
    invoicedAmount: input.invoicedAmount,
    receivedAmount: input.receivedAmount,
    remainingAmount: 0,
    status: "paid",
  };
}
