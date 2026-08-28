import type { InvoiceDocumentListItem, InvoiceSummary } from "../types";

export function getInvoiceSummary(
  documents: InvoiceDocumentListItem[],
): InvoiceSummary {
  return {
    totalDocuments: documents.length,
    pendingExtraction: documents.filter(
      (document) =>
        document.status === "uploaded" ||
        document.status === "extracting" ||
        document.status === "failed",
    ).length,
    inReview: documents.filter(
      (document) => document.reviewQueueItem?.status === "pending_review",
    ).length,
    completedOrRejected: documents.filter(
      (document) =>
        document.status === "completed" || document.status === "rejected",
    ).length,
  };
}
