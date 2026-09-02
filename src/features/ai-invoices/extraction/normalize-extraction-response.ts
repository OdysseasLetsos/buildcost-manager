import "server-only";

import type { ExtractedInvoicePayload } from "../types";
import { extractedInvoicePayloadSchema } from "../validators";
import { rawExtractionResponseSchema } from "./validators";

function normalizeDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsedDate = new Date(trimmed);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return null;
}

export function normalizeExtractionResponse(
  response: unknown,
): ExtractedInvoicePayload {
  const parsed = rawExtractionResponseSchema.parse(response);
  const normalized = {
    supplier_name: parsed.supplier_name ?? null,
    supplier_vat: parsed.supplier_vat ?? null,
    invoice_number: parsed.invoice_number ?? null,
    invoice_date: normalizeDate(parsed.invoice_date),
    net_amount: parsed.net_amount ?? 0,
    vat_amount: parsed.vat_amount ?? 0,
    total_amount: parsed.total_amount ?? 0,
    currency: parsed.currency ?? "EUR",
    target_type_suggestion: parsed.target_type_suggestion ?? "unknown",
    category_suggestion: parsed.category_suggestion ?? parsed.description ?? null,
    project_suggestion_id: parsed.project_suggestion_id ?? null,
    confidence_score: parsed.confidence_score ?? 0,
    line_items: parsed.line_items ?? [],
    warnings: parsed.warnings ?? [],
    raw_extraction: parsed.raw_extraction ?? response,
  };

  return extractedInvoicePayloadSchema.parse(normalized);
}
