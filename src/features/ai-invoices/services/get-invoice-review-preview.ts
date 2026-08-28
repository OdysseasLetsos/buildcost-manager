import { createClient } from "@/src/integrations/supabase/server";
import type {
  ExtractedInvoice,
  InvoiceDocument,
  InvoicePreview,
  InvoiceReviewQueueItem,
} from "../types";
import { requireAiInvoiceAccess } from "./require-ai-invoice-access";

export async function getInvoiceReviewPreview(
  companyId: string,
  documentId: string,
): Promise<InvoicePreview | null> {
  const context = await requireAiInvoiceAccess();

  if (context.companyId !== companyId) {
    throw new Error("Δεν έχετε δικαίωμα πρόσβασης στην ανάλυση τιμολογίων.");
  }

  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("invoice_documents")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    console.error("[ai-invoices:getInvoiceReviewPreview:document] Supabase error", {
      message: documentError.message,
      code: documentError.code,
      details: documentError.details,
      hint: documentError.hint,
    });
    throw new Error("Δεν ήταν δυνατή η φόρτωση του τιμολογίου.");
  }

  if (!document) {
    return null;
  }

  const [extractedResult, reviewResult] = await Promise.all([
    supabase
      .from("extracted_invoices")
      .select("*")
      .eq("company_id", companyId)
      .eq("invoice_document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("invoice_review_queue")
      .select("*")
      .eq("company_id", companyId)
      .eq("invoice_document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (extractedResult.error || reviewResult.error) {
    const error = extractedResult.error ?? reviewResult.error;
    console.error("[ai-invoices:getInvoiceReviewPreview:relations] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατή η φόρτωση της προεπισκόπησης.");
  }

  return {
    document: document as InvoiceDocument,
    extractedInvoice: (extractedResult.data as ExtractedInvoice | null) ?? null,
    reviewQueueItem: (reviewResult.data as InvoiceReviewQueueItem | null) ?? null,
  };
}
