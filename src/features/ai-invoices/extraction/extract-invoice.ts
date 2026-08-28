import "server-only";
import { extractionModeSchema } from "../validators";
import { extractInvoiceFromExternalApi } from "./external-api";
import { extractInvoiceWithMock } from "./mock";
import type { InvoiceExtractor } from "./types";

export const extractInvoice: InvoiceExtractor = async (document) => {
  const mode = extractionModeSchema.parse(process.env.INVOICE_EXTRACTION_MODE);

  if (mode === "external") {
    return extractInvoiceFromExternalApi(document);
  }

  return extractInvoiceWithMock(document);
};
