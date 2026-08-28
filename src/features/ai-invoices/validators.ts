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

export const maxInvoiceFileSizeBytes = 10 * 1024 * 1024;

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

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = (message: string) => z.string().trim().min(1, message);

const nonNegativeAmount = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value), {
      message: `${fieldLabel} πρέπει να είναι αριθμός.`,
    })
    .refine((value) => value >= 0, {
      message: `${fieldLabel} δεν μπορεί να είναι αρνητικό.`,
    });

export const invoiceReviewTargetTypes = ["material", "expense", "revenue"] as const;

export const invoiceReviewApprovalSchema = z.object({
  reviewId: z.string().uuid("Το τιμολόγιο προς έλεγχο δεν είναι έγκυρο."),
  targetType: z.enum(invoiceReviewTargetTypes, {
    message: "Επιλέξτε τύπο καταχώρησης.",
  }),
  monthId: z.string().uuid("Επιλέξτε μήνα."),
  projectId: optionalText,
  supplierId: optionalText,
  supplierName: optionalText,
  supplierVat: optionalText,
  invoiceNumber: optionalText,
  invoiceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Η ημερομηνία δεν είναι έγκυρη."),
  netAmount: nonNegativeAmount("Η καθαρή αξία"),
  vatAmount: nonNegativeAmount("Το ΦΠΑ"),
  totalAmount: nonNegativeAmount("Το σύνολο"),
  paidAmount: nonNegativeAmount("Το πληρωμένο ποσό").default(0),
  paymentStatus: z.enum(["pending", "partial", "paid"]).default("pending"),
  description: optionalText,
  notes: optionalText,
  expenseCategory: optionalText,
  expenseSubtype: optionalText,
  allocationMethod: z
    .enum([
      "by_project_hours",
      "by_project_revenue",
      "equal_per_active_project",
      "manual",
    ])
    .default("by_project_hours"),
  clientName: optionalText,
  revenueType: z.enum(["invoice", "advance", "payment", "credit"]).default("invoice"),
  paymentMethod: z.enum(["bank", "cash", "other"]).default("bank"),
  status: z.enum(["pending", "partial", "paid", "cancelled"]).default("pending"),
});

export const invoiceReviewCorrectionSchema = invoiceReviewApprovalSchema.extend({
  reviewId: z.string().uuid("Το τιμολόγιο προς έλεγχο δεν είναι έγκυρο."),
});

export const invoiceReviewRejectSchema = z.object({
  reviewId: z.string().uuid("Το τιμολόγιο προς έλεγχο δεν είναι έγκυρο."),
  rejectionReason: requiredText("Συμπληρώστε λόγο απόρριψης."),
});

export type InvoiceReviewApprovalInput = z.infer<
  typeof invoiceReviewApprovalSchema
>;

export function validateInvoiceFile(file: File): string | null {
  if (!acceptedInvoiceMimeTypes.includes(file.type as never)) {
    return "Ο τύπος αρχείου δεν υποστηρίζεται.";
  }

  if (file.size > maxInvoiceFileSizeBytes) {
    return "Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10MB.";
  }

  if (file.size <= 0) {
    return "Το αρχείο δεν είναι έγκυρο.";
  }

  return null;
}
