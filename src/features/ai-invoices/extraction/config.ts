import "server-only";

export type InvoiceExtractionMode = "mock" | "external";

export class InvoiceExtractionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceExtractionConfigurationError";
  }
}

export type InvoiceExtractionConfig = {
  mode: InvoiceExtractionMode;
  apiUrl: string | null;
  apiKey: string | null;
};

const allowedExtractionModes: readonly InvoiceExtractionMode[] = [
  "mock",
  "external",
];

export function getInvoiceExtractionConfig(): InvoiceExtractionConfig {
  const rawMode = process.env.INVOICE_EXTRACTION_MODE?.trim() || "mock";

  if (!allowedExtractionModes.includes(rawMode as InvoiceExtractionMode)) {
    throw new InvoiceExtractionConfigurationError(
      "Η ρύθμιση της AI ανάλυσης τιμολογίων δεν είναι έγκυρη.",
    );
  }

  return {
    mode: rawMode as InvoiceExtractionMode,
    apiUrl: process.env.INVOICE_EXTRACTION_API_URL?.trim() || null,
    apiKey: process.env.INVOICE_EXTRACTION_API_KEY?.trim() || null,
  };
}
