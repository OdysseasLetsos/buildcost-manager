import { z } from "zod";
import {
  invoiceExtractionModes,
  invoiceTargetTypeSuggestions,
  type ExtractedInvoicePayload,
} from "./types";

export const acceptedInvoiceMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const maxInvoiceFileSizeBytes = 20 * 1024 * 1024;

export const selectedMonthKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Ο μήνας δεν είναι έγκυρος.")
  .nullable();

export const extractedInvoicePayloadSchema = z.object({
  supplier_name: z.string().trim().min(1).nullable().default(null),
  supplier_vat: z.string().trim().min(1).nullable().default(null),
  invoice_number: z.string().trim().min(1).nullable().default(null),
  invoice_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .default(null),
  net_amount: z.number().min(0).default(0),
  vat_amount: z.number().min(0).default(0),
  total_amount: z.number().min(0).default(0),
  currency: z.string().trim().min(1).default("EUR"),
  target_type_suggestion: z.enum(invoiceTargetTypeSuggestions).default("unknown"),
  category_suggestion: z.string().trim().min(1).nullable().default(null),
  project_suggestion_id: z.string().uuid().nullable().default(null),
  confidence_score: z.number().min(0).max(1).default(0),
  line_items: z.array(z.record(z.string(), z.unknown())).default([]),
  warnings: z.array(z.string()).default([]),
  raw_extraction: z.unknown().optional(),
}) satisfies z.ZodType<ExtractedInvoicePayload>;

export const extractionModeSchema = z
  .enum(invoiceExtractionModes)
  .catch("mock");

export function validateInvoiceFile(file: File): string | null {
  if (!acceptedInvoiceMimeTypes.includes(file.type as never)) {
    return "Ο τύπος αρχείου δεν υποστηρίζεται.";
  }

  if (file.size > maxInvoiceFileSizeBytes) {
    return "Το αρχείο είναι πολύ μεγάλο.";
  }

  if (file.size <= 0) {
    return "Το αρχείο δεν είναι έγκυρο.";
  }

  return null;
}
