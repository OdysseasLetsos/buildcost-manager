"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/src/core/audit";
import { createClient } from "@/src/integrations/supabase/server";
import type { Json } from "@/src/integrations/supabase/types";
import { extractInvoice } from "../extraction/extract-invoice";
import type {
  ExtractedInvoicePayload,
  InvoiceActionState,
  InvoiceDocument,
} from "../types";
import { extractedInvoicePayloadSchema } from "../validators";
import { requireAiInvoiceAccess } from "../services/require-ai-invoice-access";

async function addDuplicateWarning(
  companyId: string,
  payload: ExtractedInvoicePayload,
): Promise<ExtractedInvoicePayload> {
  if (!payload.supplier_vat || !payload.invoice_number) {
    return payload;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("extracted_invoices")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("supplier_vat", payload.supplier_vat)
    .eq("invoice_number", payload.invoice_number);

  if (error) {
    console.error("[ai-invoices:extract:duplicate] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return payload;
  }

  if (!count) {
    return payload;
  }

  return {
    ...payload,
    warnings: [
      ...payload.warnings,
      "Πιθανό διπλό τιμολόγιο με ίδιο ΑΦΜ και αριθμό τιμολογίου.",
    ],
  };
}

export async function runInvoiceExtraction(
  documentId: string,
): Promise<InvoiceActionState> {
  let context;

  try {
    context = await requireAiInvoiceAccess();
  } catch (error) {
    console.error("[ai-invoices:extract:access]", error);
    return {
      ok: false,
      message: "Δεν έχετε δικαίωμα πρόσβασης στην ανάλυση τιμολογίων.",
    };
  }

  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("invoice_documents")
    .select("*")
    .eq("company_id", context.companyId)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    console.error("[ai-invoices:extract:document] Supabase error", {
      message: documentError?.message,
      code: documentError?.code,
      details: documentError?.details,
      hint: documentError?.hint,
    });
    return { ok: false, message: "Το τιμολόγιο δεν βρέθηκε." };
  }

  const invoiceDocument = document as InvoiceDocument;

  await writeAuditLog({
    companyId: context.companyId,
    action: "invoice_extraction.started",
    entityType: "invoice_document",
    entityId: invoiceDocument.id,
    metadata: { fileName: invoiceDocument.original_file_name },
  });

  const { error: extractingError } = await supabase
    .from("invoice_documents")
    .update({ status: "extracting" })
    .eq("company_id", context.companyId)
    .eq("id", invoiceDocument.id);

  if (extractingError) {
    console.error("[ai-invoices:extract:status] Supabase error", {
      message: extractingError.message,
      code: extractingError.code,
      details: extractingError.details,
      hint: extractingError.hint,
    });
    return { ok: false, message: "Δεν ήταν δυνατή η ανάλυση του τιμολογίου." };
  }

  try {
    const extracted = await extractInvoice(invoiceDocument);
    const parsed = extractedInvoicePayloadSchema.safeParse(extracted);

    if (!parsed.success) {
      throw new Error("Η απάντηση της ανάλυσης δεν έχει έγκυρη μορφή.");
    }

    const payload = await addDuplicateWarning(context.companyId, parsed.data);
    const { data: extractedInvoice, error: extractedError } = await supabase
      .from("extracted_invoices")
      .insert({
        company_id: context.companyId,
        invoice_document_id: invoiceDocument.id,
        supplier_name: payload.supplier_name,
        supplier_vat: payload.supplier_vat,
        invoice_number: payload.invoice_number,
        invoice_date: payload.invoice_date,
        net_amount: payload.net_amount,
        vat_amount: payload.vat_amount,
        total_amount: payload.total_amount,
        currency: payload.currency,
        target_type_suggestion: payload.target_type_suggestion,
        category_suggestion: payload.category_suggestion,
        project_suggestion_id: payload.project_suggestion_id,
        confidence_score: payload.confidence_score,
        line_items: payload.line_items as Json,
        warnings: payload.warnings as Json,
        raw_extraction: (payload.raw_extraction ?? payload) as Json,
        extraction_mode: "mock",
      })
      .select("id")
      .single();

    if (extractedError || !extractedInvoice) {
      console.error("[ai-invoices:extract:insert] Supabase error", {
        message: extractedError?.message,
        code: extractedError?.code,
        details: extractedError?.details,
        hint: extractedError?.hint,
      });
      throw new Error("Δεν ήταν δυνατή η ανάλυση του τιμολογίου.");
    }

    const { data: reviewItem, error: reviewError } = await supabase
      .from("invoice_review_queue")
      .insert({
        company_id: context.companyId,
        invoice_document_id: invoiceDocument.id,
        extracted_invoice_id: extractedInvoice.id,
        status: "pending_review",
      })
      .select("id")
      .single();

    if (reviewError || !reviewItem) {
      console.error("[ai-invoices:extract:review] Supabase error", {
        message: reviewError?.message,
        code: reviewError?.code,
        details: reviewError?.details,
        hint: reviewError?.hint,
      });
      throw new Error("Δεν ήταν δυνατή η δημιουργία εγγραφής ελέγχου.");
    }

    const { error: reviewStatusError } = await supabase
      .from("invoice_documents")
      .update({ status: "review" })
      .eq("company_id", context.companyId)
      .eq("id", invoiceDocument.id);

    if (reviewStatusError) {
      console.error("[ai-invoices:extract:reviewStatus] Supabase error", {
        message: reviewStatusError.message,
        code: reviewStatusError.code,
        details: reviewStatusError.details,
        hint: reviewStatusError.hint,
      });
      throw new Error("Δεν ήταν δυνατή η ενημέρωση της κατάστασης τιμολογίου.");
    }

    await writeAuditLog({
      companyId: context.companyId,
      action: "invoice_extraction.completed",
      entityType: "invoice_document",
      entityId: invoiceDocument.id,
      metadata: {
        extractedInvoiceId: extractedInvoice.id,
        reviewId: reviewItem.id,
        extractionMode: "mock",
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/materials");
    revalidatePath("/ai-invoices");

    return {
      ok: true,
      message: "Η ανάλυση mock ολοκληρώθηκε επιτυχώς. Το τιμολόγιο στάλθηκε για έλεγχο.",
      reviewId: reviewItem.id,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Δεν ήταν δυνατή η ανάλυση του τιμολογίου.";

    console.error("[ai-invoices:extract] Error", {
      message,
      documentId: invoiceDocument.id,
    });

    await supabase
      .from("invoice_documents")
      .update({ status: "failed" })
      .eq("company_id", context.companyId)
      .eq("id", invoiceDocument.id);

    await writeAuditLog({
      companyId: context.companyId,
      action: "invoice_extraction.failed",
      entityType: "invoice_document",
      entityId: invoiceDocument.id,
      metadata: { message },
    });

    return {
      ok: false,
      message:
        message === "Η απάντηση της ανάλυσης δεν έχει έγκυρη μορφή."
          ? message
          : "Δεν ήταν δυνατή η ανάλυση του τιμολογίου.",
    };
  }
}
