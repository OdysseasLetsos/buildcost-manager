import type { RevenueInput } from "../validators";
import { calculateRevenueStatus, type NormalizedRevenueAmounts } from "./calculate-revenue-status";

export function normalizeRevenueInput(input: RevenueInput): NormalizedRevenueAmounts {
  if (input.revenueType === "invoice") {
    if (input.invoicedAmount <= 0) {
      throw new Error("Το τιμολόγιο πρέπει να έχει τιμολογηθέν ποσό μεγαλύτερο από 0.");
    }

    if (input.receivedAmount > input.invoicedAmount) {
      throw new Error("Το εισπραχθέν ποσό δεν μπορεί να υπερβαίνει το τιμολογηθέν.");
    }
  }

  if (input.revenueType === "advance" && input.receivedAmount <= 0) {
    throw new Error("Η προκαταβολή πρέπει να έχει εισπραχθέν ποσό μεγαλύτερο από 0.");
  }

  if (input.revenueType === "payment" && input.receivedAmount <= 0) {
    throw new Error("Η εξόφληση πρέπει να έχει εισπραχθέν ποσό μεγαλύτερο από 0.");
  }

  if (
    input.revenueType === "credit" &&
    input.invoicedAmount <= 0 &&
    input.receivedAmount <= 0
  ) {
    throw new Error("Το πιστωτικό πρέπει να έχει τιμολογηθέν ή εισπραχθέν ποσό.");
  }

  return calculateRevenueStatus(input);
}
