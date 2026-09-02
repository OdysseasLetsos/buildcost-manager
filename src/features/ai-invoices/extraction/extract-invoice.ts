import "server-only";
import { getInvoiceExtractionConfig } from "./config";
import { extractInvoiceFromExternalApi } from "./external-api";
import { extractInvoiceWithMock } from "./mock";
import type { InvoiceExtractionResult, InvoiceExtractor } from "./types";

export const extractInvoice: InvoiceExtractor = async (
  document,
): Promise<InvoiceExtractionResult> => {
  const config = getInvoiceExtractionConfig();

  if (config.mode === "external") {
    return {
      mode: config.mode,
      payload: await extractInvoiceFromExternalApi(document, config),
    };
  }

  return {
    mode: config.mode,
    payload: await extractInvoiceWithMock(document),
  };
};
