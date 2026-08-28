import { createClient } from "@/src/integrations/supabase/server";
import type {
  ExtractedInvoice,
  InvoiceDocument,
  InvoiceDocumentListItem,
  InvoiceReviewQueueItem,
} from "../types";
import { requireAiInvoiceAccess } from "./require-ai-invoice-access";

function normalizeDocument(document: InvoiceDocument): InvoiceDocument {
  const status = ["uploaded", "extracting", "review", "rejected", "completed", "failed"].includes(
    document.status,
  )
    ? document.status
    : "uploaded";

  return { ...document, status };
}

function normalizeExtractedInvoice(invoice: ExtractedInvoice): ExtractedInvoice {
  const targetType = ["material", "expense", "revenue", "unknown"].includes(
    invoice.target_type_suggestion,
  )
    ? invoice.target_type_suggestion
    : "unknown";
  const extractionMode = invoice.extraction_mode === "external" ? "external" : "mock";

  return {
    ...invoice,
    target_type_suggestion: targetType,
    extraction_mode: extractionMode,
  };
}

function normalizeReviewQueueItem(
  item: InvoiceReviewQueueItem,
): InvoiceReviewQueueItem {
  const status = ["pending_review", "corrected", "approved", "rejected"].includes(
    item.status,
  )
    ? item.status
    : "pending_review";

  return { ...item, status };
}

export async function listInvoiceDocuments(
  companyId: string,
): Promise<InvoiceDocumentListItem[]> {
  const context = await requireAiInvoiceAccess();

  if (context.companyId !== companyId) {
    throw new Error("Δεν έχετε δικαίωμα πρόσβασης στην ανάλυση τιμολογίων.");
  }

  const supabase = await createClient();
  const { data: documents, error: documentsError } = await supabase
    .from("invoice_documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("[ai-invoices:listInvoiceDocuments:documents] Supabase error", {
      message: documentsError.message,
      code: documentsError.code,
      details: documentsError.details,
      hint: documentsError.hint,
    });
    throw new Error("Δεν ήταν δυνατή η φόρτωση των τιμολογίων AI.");
  }

  const normalizedDocuments = ((documents ?? []) as InvoiceDocument[]).map(
    normalizeDocument,
  );
  const documentIds = normalizedDocuments.map((document) => document.id);

  if (documentIds.length === 0) {
    return [];
  }

  const [extractedResult, reviewResult] = await Promise.all([
    supabase
      .from("extracted_invoices")
      .select("*")
      .eq("company_id", companyId)
      .in("invoice_document_id", documentIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoice_review_queue")
      .select("*")
      .eq("company_id", companyId)
      .in("invoice_document_id", documentIds)
      .order("created_at", { ascending: false }),
  ]);

  if (extractedResult.error || reviewResult.error) {
    const error = extractedResult.error ?? reviewResult.error;
    console.error("[ai-invoices:listInvoiceDocuments:relations] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατή η φόρτωση της προεπισκόπησης AI.");
  }

  const extractedByDocument = new Map(
    ((extractedResult.data ?? []) as ExtractedInvoice[]).map((invoice) => [
      invoice.invoice_document_id,
      normalizeExtractedInvoice(invoice),
    ]),
  );
  const reviewByDocument = new Map(
    ((reviewResult.data ?? []) as InvoiceReviewQueueItem[]).map((item) => [
      item.invoice_document_id,
      normalizeReviewQueueItem(item),
    ]),
  );

  return normalizedDocuments.map((document) => ({
    ...document,
    extractedInvoice: extractedByDocument.get(document.id) ?? null,
    reviewQueueItem: reviewByDocument.get(document.id) ?? null,
  }));
}
