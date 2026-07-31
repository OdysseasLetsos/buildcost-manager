import type { RevenueInput } from "../validators";
import { calculateRevenueStatus, type NormalizedRevenueAmounts } from "./calculate-revenue-status";

export function normalizeRevenueInput(input: RevenueInput): NormalizedRevenueAmounts {
  if (input.invoicedAmount <= 0) {
    throw new Error("Το συνολικό ποσό πρέπει να είναι μεγαλύτερο από 0.");
  }

  if (input.receivedAmount > input.invoicedAmount) {
    throw new Error(
      "Το εισπραχθέν ποσό δεν μπορεί να είναι μεγαλύτερο από το συνολικό ποσό.",
    );
  }

  if (input.revenueType === "advance" && input.receivedAmount <= 0) {
    throw new Error("Η προκαταβολή πρέπει να έχει εισπραχθέν ποσό μεγαλύτερο από 0.");
  }

  if (input.revenueType === "payment" && input.receivedAmount <= 0) {
    throw new Error("Η εξόφληση πρέπει να έχει εισπραχθέν ποσό μεγαλύτερο από 0.");
  }

  return calculateRevenueStatus(input);
}
