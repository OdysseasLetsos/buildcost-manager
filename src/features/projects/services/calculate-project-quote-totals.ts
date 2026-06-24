import type { ProjectQuote, ProjectQuoteTotals } from "../types";

export function calculateProjectQuoteTotals(
  initialBudget: number | null,
  quotes: readonly ProjectQuote[],
): ProjectQuoteTotals {
  const totals: ProjectQuoteTotals = {
    initialBudget: initialBudget ?? 0,
    approvedQuotesTotal: 0,
    pendingQuotesTotal: 0,
    draftQuotesTotal: 0,
    rejectedQuotesTotal: 0,
  };

  for (const quote of quotes) {
    const amount = quote.total_amount;

    if (quote.status === "approved") {
      totals.approvedQuotesTotal += amount;
    } else if (
      quote.status === "sent" ||
      quote.status === "pending_approval"
    ) {
      totals.pendingQuotesTotal += amount;
    } else if (quote.status === "draft") {
      totals.draftQuotesTotal += amount;
    } else if (quote.status === "rejected") {
      totals.rejectedQuotesTotal += amount;
    }
  }

  return totals;
}
