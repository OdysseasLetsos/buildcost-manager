import type { ProjectQuoteStatus, ProjectQuoteTotals } from "../types";

type ProjectQuoteTotalSource = {
  status: ProjectQuoteStatus | string;
  amount?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
};

function quoteAmount(quote: ProjectQuoteTotalSource): number {
  if (typeof quote.total_amount === "number") return quote.total_amount;
  if (typeof quote.amount === "number") {
    return quote.amount + (quote.vat_amount ?? 0);
  }

  return 0;
}

export function calculateProjectQuoteTotals(
  initialBudget: number | null,
  quotes: readonly ProjectQuoteTotalSource[],
): ProjectQuoteTotals {
  const totals: ProjectQuoteTotals = {
    initialBudget: initialBudget ?? 0,
    approvedQuotesTotal: 0,
    pendingQuotesTotal: 0,
    draftQuotesTotal: 0,
    rejectedQuotesTotal: 0,
  };

  for (const quote of quotes) {
    const amount = quoteAmount(quote);

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
