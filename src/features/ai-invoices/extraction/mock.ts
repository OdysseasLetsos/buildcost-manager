import type {
  ExtractedInvoicePayload,
  InvoiceTargetTypeSuggestion,
} from "@/src/features/ai-invoices/types";
import type { InvoiceExtractionDocument } from "./types";

function stableNumber(input: string): number {
  return [...input].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % 100000,
    7,
  );
}

function invoiceDateFor(document: InvoiceExtractionDocument): string {
  if (document.selected_month_key) {
    return `${document.selected_month_key}-01`;
  }

  return document.created_at.slice(0, 10);
}

function targetTypeFor(seed: number): InvoiceTargetTypeSuggestion {
  const values: InvoiceTargetTypeSuggestion[] = ["material", "expense", "revenue"];
  return values[seed % values.length] ?? "material";
}

export async function extractInvoiceWithMock(
  document: InvoiceExtractionDocument,
): Promise<ExtractedInvoicePayload> {
  const seed = stableNumber(`${document.id}:${document.original_file_name}`);
  const netAmount = 100 + (seed % 75);
  const vatAmount = Number((netAmount * 0.24).toFixed(2));
  const totalAmount = Number((netAmount + vatAmount).toFixed(2));

  return {
    supplier_name: "Δοκιμαστικός Προμηθευτής Α.Ε.",
    supplier_vat: "123456789",
    invoice_number: `MOCK-${String(seed % 1000).padStart(3, "0")}`,
    invoice_date: invoiceDateFor(document),
    net_amount: netAmount,
    vat_amount: vatAmount,
    total_amount: totalAmount,
    currency: "EUR",
    target_type_suggestion: targetTypeFor(seed),
    category_suggestion: "Υλικά",
    project_suggestion_id: null,
    confidence_score: 0.92,
    line_items: [
      {
        description: "Δοκιμαστικό υλικό",
        quantity: 1,
        unit_price: netAmount,
        total: netAmount,
      },
    ],
    warnings: ["Mock ανάλυση για δοκιμή ροής."],
    raw_extraction: {
      mode: "mock",
      document_id: document.id,
      file_name: document.original_file_name,
    },
  };
}
