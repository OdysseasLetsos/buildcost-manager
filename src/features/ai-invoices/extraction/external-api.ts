import "server-only";
import type { ExtractedInvoicePayload } from "@/src/features/ai-invoices/types";
import {
  InvoiceExtractionConfigurationError,
  type InvoiceExtractionConfig,
} from "./config";
import type { InvoiceExtractionDocument } from "./types";

export async function extractInvoiceFromExternalApi(
  document: InvoiceExtractionDocument,
  config: InvoiceExtractionConfig,
): Promise<ExtractedInvoicePayload> {
  void document;

  if (!config.apiUrl || !config.apiKey) {
    throw new InvoiceExtractionConfigurationError(
      "Η εξωτερική AI ανάλυση δεν έχει ρυθμιστεί ακόμα.",
    );
  }

  // Phase 3A only prepares the external adapter socket. Phase 3B will decide
  // signed URL vs storage_path vs multipart vs base64 after the real API
  // contract is known. Possible future request shape:
  // { file_url: "temporary_signed_url", file_name: "invoice.pdf", mime_type: "application/pdf" }
  // Also add timeout/retry handling and strict response validation in Phase 3B.
  throw new Error(
    "Η εξωτερική ανάλυση τιμολογίων θα ενεργοποιηθεί σε επόμενη φάση.",
  );
}
