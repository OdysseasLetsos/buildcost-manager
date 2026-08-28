import type {
  ExtractedInvoicePayload,
  InvoiceDocument,
} from "@/src/features/ai-invoices/types";

export type InvoiceExtractionDocument = Pick<
  InvoiceDocument,
  | "id"
  | "storage_bucket"
  | "storage_path"
  | "original_file_name"
  | "mime_type"
  | "selected_month_key"
  | "created_at"
>;

export type InvoiceExtractor = (
  document: InvoiceExtractionDocument,
) => Promise<ExtractedInvoicePayload>;
