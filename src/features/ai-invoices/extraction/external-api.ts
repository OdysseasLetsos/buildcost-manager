import "server-only";
import type { ExtractedInvoicePayload } from "@/src/features/ai-invoices/types";
import type { InvoiceExtractionDocument } from "./types";

export async function extractInvoiceFromExternalApi(
  _document: InvoiceExtractionDocument,
): Promise<ExtractedInvoicePayload> {
  void _document;

  const apiUrl = process.env.INVOICE_EXTRACTION_API_URL;
  const apiKey = process.env.INVOICE_EXTRACTION_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Η εξωτερική υπηρεσία ανάλυσης τιμολογίων δεν έχει ρυθμιστεί.",
    );
  }

  // TODO Phase 3: decide signed URL vs storage_path based on the external API
  // contract, then add timeout/retry handling and validate the returned JSON.
  throw new Error(
    "Η εξωτερική ανάλυση τιμολογίων θα ενεργοποιηθεί σε επόμενη φάση.",
  );
}
