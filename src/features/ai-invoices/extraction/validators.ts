import { z } from "zod";
import { invoiceTargetTypeSuggestions } from "../types";

export const rawExtractionResponseSchema = z.object({
  supplier_name: z.string().trim().min(1).nullable().optional(),
  supplier_vat: z.string().trim().min(1).nullable().optional(),
  invoice_number: z.string().trim().min(1).nullable().optional(),
  invoice_date: z
    .union([z.string().trim(), z.date()])
    .nullable()
    .optional(),
  net_amount: z.coerce.number().min(0).optional(),
  vat_amount: z.coerce.number().min(0).optional(),
  total_amount: z.coerce.number().min(0).optional(),
  currency: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  target_type_suggestion: z.enum(invoiceTargetTypeSuggestions).optional(),
  category_suggestion: z.string().trim().min(1).nullable().optional(),
  project_suggestion_id: z.string().uuid().nullable().optional(),
  confidence_score: z.coerce.number().min(0).max(1).optional(),
  line_items: z.array(z.record(z.string(), z.unknown())).optional(),
  warnings: z.array(z.string()).optional(),
  raw_extraction: z.unknown().optional(),
});

export type RawExtractionResponse = z.infer<typeof rawExtractionResponseSchema>;
