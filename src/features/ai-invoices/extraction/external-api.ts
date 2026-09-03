import "server-only";
import type { ExtractedInvoicePayload } from "@/src/features/ai-invoices/types";
import {
  InvoiceExtractionConfigurationError,
  type InvoiceExtractionConfig,
} from "./config";
import { normalizeExtractionResponse } from "./normalize-extraction-response";
import type { InvoiceExtractionDocument } from "./types";

export async function extractInvoiceFromExternalApi(
  document: InvoiceExtractionDocument,
  config: InvoiceExtractionConfig,
): Promise<ExtractedInvoicePayload> {
  if (!config.apiUrl || !config.apiKey) {
    throw new InvoiceExtractionConfigurationError(
      "Η εξωτερική AI ανάλυση δεν έχει ρυθμιστεί ακόμα.",
    );
  }

  // Phase 3A uses a server-side JSON adapter only. Phase 3B will decide signed
  // URL vs storage_path vs multipart vs base64 after the real API contract is
  // known, and will add timeout/retry handling for production traffic.
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({
      file_url: `storage://${document.storage_bucket}/${document.storage_path}`,
      file_name: document.original_file_name,
      mime_type: document.mime_type,
    }),
  }).catch(() => {
    throw new Error(
      "Η εξωτερική AI ανάλυση δεν ολοκληρώθηκε. Ελέγξτε τις ρυθμίσεις σύνδεσης.",
    );
  });

  if (response.status === 401) {
    throw new Error(
      "Η εξωτερική AI ανάλυση δεν ολοκληρώθηκε. Ελέγξτε τις ρυθμίσεις σύνδεσης.",
    );
  }

  if (!response.ok) {
    throw new Error(
      "Η εξωτερική AI ανάλυση δεν ολοκληρώθηκε. Ελέγξτε τις ρυθμίσεις σύνδεσης.",
    );
  }

  const body = await response.json().catch(() => {
    throw new Error(
      "Η απάντηση της εξωτερικής AI ανάλυσης δεν έχει έγκυρη μορφή.",
    );
  });

  try {
    return normalizeExtractionResponse(body);
  } catch {
    throw new Error(
      "Η απάντηση της εξωτερικής AI ανάλυσης δεν έχει έγκυρη μορφή.",
    );
  }
}
