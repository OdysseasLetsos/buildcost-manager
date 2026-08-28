import type { Database } from "@/src/integrations/supabase/types";

export const invoiceDocumentStatuses = [
  "uploaded",
  "extracting",
  "review",
  "rejected",
  "completed",
  "failed",
] as const;

export const invoiceReviewStatuses = [
  "pending_review",
  "corrected",
  "approved",
  "rejected",
] as const;

export const invoiceTargetTypeSuggestions = [
  "material",
  "expense",
  "revenue",
  "unknown",
] as const;

export const invoiceExtractionModes = ["mock", "external"] as const;

export type InvoiceDocumentStatus = (typeof invoiceDocumentStatuses)[number];
export type InvoiceReviewStatus = (typeof invoiceReviewStatuses)[number];
export type InvoiceTargetTypeSuggestion =
  (typeof invoiceTargetTypeSuggestions)[number];
export type InvoiceExtractionMode = (typeof invoiceExtractionModes)[number];

export type InvoiceDocument = Omit<
  Database["public"]["Tables"]["invoice_documents"]["Row"],
  "status"
> & {
  status: InvoiceDocumentStatus;
};

export type ExtractedInvoice = Omit<
  Database["public"]["Tables"]["extracted_invoices"]["Row"],
  "extraction_mode" | "target_type_suggestion"
> & {
  extraction_mode: InvoiceExtractionMode;
  target_type_suggestion: InvoiceTargetTypeSuggestion;
};

export type InvoiceReviewQueueItem = Omit<
  Database["public"]["Tables"]["invoice_review_queue"]["Row"],
  "status"
> & {
  status: InvoiceReviewStatus;
};

export type ExtractedInvoicePayload = {
  supplier_name: string | null;
  supplier_vat: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  target_type_suggestion: InvoiceTargetTypeSuggestion;
  category_suggestion: string | null;
  project_suggestion_id: string | null;
  confidence_score: number;
  line_items: Record<string, unknown>[];
  warnings: string[];
  raw_extraction?: unknown;
};

export type InvoiceDocumentListItem = InvoiceDocument & {
  extractedInvoice: ExtractedInvoice | null;
  reviewQueueItem: InvoiceReviewQueueItem | null;
};

export type InvoicePreview = {
  document: InvoiceDocument;
  extractedInvoice: ExtractedInvoice | null;
  reviewQueueItem: InvoiceReviewQueueItem | null;
};

export type InvoiceSummary = {
  totalDocuments: number;
  pendingExtraction: number;
  inReview: number;
  completedOrRejected: number;
};

export type InvoiceActionState = {
  ok: boolean;
  message?: string;
  documentId?: string;
  reviewId?: string;
  extractedInvoice?: ExtractedInvoicePayload;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialInvoiceActionState: InvoiceActionState = {
  ok: false,
};
