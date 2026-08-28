"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/src/core/audit";
import { createClient } from "@/src/integrations/supabase/server";
import type { InvoiceActionState } from "../types";
import { initialInvoiceActionState } from "../types";
import {
  selectedMonthKeySchema,
  validateInvoiceFile,
} from "../validators";
import { requireAiInvoiceAccess } from "../services/require-ai-invoice-access";

const storageBucket = "invoice-documents";

function safeFileName(fileName: string): string {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "invoice";
}

async function validateSelectedMonthKey(
  companyId: string,
  value: FormDataEntryValue | null,
): Promise<string | null> {
  const rawValue = typeof value === "string" && value.trim() ? value : null;
  const parsed = selectedMonthKeySchema.safeParse(rawValue);

  if (!parsed.success || !parsed.data) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_periods")
    .select("month_key")
    .eq("company_id", companyId)
    .eq("month_key", parsed.data)
    .maybeSingle();

  if (error) {
    console.error("[ai-invoices:upload:month] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Δεν ήταν δυνατός ο έλεγχος του μήνα.");
  }

  return data?.month_key ?? null;
}

export async function uploadInvoiceDocument(
  _previousState: InvoiceActionState = initialInvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  void _previousState;

  let context;

  try {
    context = await requireAiInvoiceAccess();
  } catch (error) {
    console.error("[ai-invoices:upload:access]", error);
    return {
      ok: false,
      message: "Δεν έχετε δικαίωμα πρόσβασης στην ανάλυση τιμολογίων.",
    };
  }

  const file = formData.get("invoiceFile");

  if (!(file instanceof File)) {
    return { ok: false, message: "Επιλέξτε αρχείο τιμολογίου." };
  }

  const fileError = validateInvoiceFile(file);

  if (fileError) {
    return { ok: false, message: fileError };
  }

  let selectedMonthKey: string | null;

  try {
    selectedMonthKey = await validateSelectedMonthKey(
      context.companyId,
      formData.get("selectedMonthKey"),
    );
  } catch (error) {
    console.error("[ai-invoices:upload:month]", error);
    return { ok: false, message: "Δεν ήταν δυνατός ο έλεγχος του μήνα." };
  }

  const supabase = await createClient();
  const documentId = randomUUID();
  const storagePath = `${context.companyId}/${context.userId}/${documentId}-${safeFileName(
    file.name,
  )}`;

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[ai-invoices:upload:storage] Supabase error", {
      message: uploadError.message,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η αποθήκευση του αρχείου." };
  }

  const { data: document, error: insertError } = await supabase
    .from("invoice_documents")
    .insert({
      id: documentId,
      company_id: context.companyId,
      uploaded_by: context.userId,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      original_file_name: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      status: "uploaded",
      selected_month_key: selectedMonthKey,
    })
    .select("id")
    .single();

  if (insertError || !document) {
    await supabase.storage.from(storageBucket).remove([storagePath]);
    console.error("[ai-invoices:upload:document] Supabase error", {
      message: insertError?.message,
      code: insertError?.code,
      details: insertError?.details,
      hint: insertError?.hint,
    });

    return {
      ok: false,
      message: "Δεν ήταν δυνατή η δημιουργία εγγραφής τιμολογίου.",
    };
  }

  await writeAuditLog({
    companyId: context.companyId,
    action: "invoice_document.uploaded",
    entityType: "invoice_document",
    entityId: document.id,
    metadata: {
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      selectedMonthKey,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/materials");
  revalidatePath("/ai-invoices");

  return {
    ok: true,
    message: "Το τιμολόγιο ανέβηκε επιτυχώς.",
    documentId: document.id,
  };
}
