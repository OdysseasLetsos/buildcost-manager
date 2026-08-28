"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { checkDuplicateMaterialInvoice } from "@/src/features/materials/services/check-duplicate-material-invoice";
import { getSupplierById } from "@/src/features/materials/services/get-suppliers";
import { validateMaterialRelations } from "@/src/features/materials/services/validate-material-relations";
import { checkDuplicateRevenueInvoice } from "@/src/features/revenues/services/check-duplicate-revenue-invoice";
import { normalizeRevenueInput } from "@/src/features/revenues/services/normalize-revenue-input";
import { validateRevenueRelations } from "@/src/features/revenues/services/validate-revenue-relations";
import { validateExpenseRelations } from "@/src/features/expenses/services/validate-expense-relations";
import { createClient } from "@/src/integrations/supabase/server";
import type { Json } from "@/src/integrations/supabase/types";
import type { InvoiceActionState, InvoiceReviewQueueItem } from "../types";
import {
  invoiceReviewApprovalSchema,
  invoiceReviewRejectSchema,
  type InvoiceReviewApprovalInput,
} from "../validators";

type ReviewContext = {
  userId: string;
  companyId: string;
};

type LoadedReview = InvoiceReviewQueueItem & {
  extractedInvoiceId: string;
};

const finalizableReviewStatuses = ["pending_review", "corrected"] as const;

function mapLockedMonthError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("κλειδωμ")) {
    return new Error("Δεν μπορείτε να εγκρίνετε τιμολόγιο σε κλειστό μήνα.");
  }

  return error instanceof Error ? error : new Error("Το τιμολόγιο δεν είναι έγκυρο.");
}

function fieldErrors(
  validation: ReturnType<typeof invoiceReviewApprovalSchema.safeParse>,
) {
  if (validation.success) return {};
  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

async function requireInvoiceReviewContext(): Promise<ReviewContext> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new Error("Δεν βρέθηκε ενεργή εταιρεία.");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "ai_invoice_import");

  return { userId: user.id, companyId };
}

async function loadReviewItem(
  companyId: string,
  reviewId: string,
): Promise<LoadedReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_review_queue")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", reviewId)
    .maybeSingle();

  if (error) {
    console.error("[ai-invoices:review:load] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Δεν ήταν δυνατή η φόρτωση του τιμολογίου.");
  }

  if (!data) return null;

  return {
    ...(data as InvoiceReviewQueueItem),
    extractedInvoiceId: data.extracted_invoice_id,
  };
}

async function saveCorrectedExtraction(
  companyId: string,
  input: InvoiceReviewApprovalInput,
  extractedInvoiceId: string,
) {
  const supabase = await createClient();
  const correctionPayload = {
    target_type: input.targetType,
    month_id: input.monthId,
    project_id: input.projectId,
    supplier_id: input.supplierId,
    supplier_name: input.supplierName,
    supplier_vat: input.supplierVat,
    invoice_number: input.invoiceNumber,
    invoice_date: input.invoiceDate,
    net_amount: input.netAmount,
    vat_amount: input.vatAmount,
    total_amount: input.totalAmount,
    paid_amount: input.paidAmount,
    payment_status: input.paymentStatus,
    expense_category: input.expenseCategory,
    expense_subtype: input.expenseSubtype,
    allocation_method: input.allocationMethod,
    client_name: input.clientName,
    revenue_type: input.revenueType,
    payment_method: input.paymentMethod,
    status: input.status,
    description: input.description,
    notes: input.notes,
  };

  const { error } = await supabase
    .from("extracted_invoices")
    .update({
      supplier_name: input.supplierName,
      supplier_vat: input.supplierVat,
      invoice_number: input.invoiceNumber,
      invoice_date: input.invoiceDate,
      net_amount: input.netAmount,
      vat_amount: input.vatAmount,
      total_amount: input.totalAmount,
      target_type_suggestion: input.targetType,
      category_suggestion: input.expenseCategory,
      raw_extraction: correctionPayload as Json,
    })
    .eq("company_id", companyId)
    .eq("id", extractedInvoiceId);

  if (error) {
    console.error("[ai-invoices:review:correctExtraction] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Δεν ήταν δυνατή η αποθήκευση διορθώσεων.");
  }
}

async function markReviewCorrected(
  companyId: string,
  reviewId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoice_review_queue")
    .update({ status: "corrected" })
    .eq("company_id", companyId)
    .eq("id", reviewId)
    .in("status", ["pending_review", "corrected"]);

  if (error) {
    console.error("[ai-invoices:review:markCorrected] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Δεν ήταν δυνατή η αποθήκευση διορθώσεων.");
  }
}

async function approveAsMaterial(
  context: ReviewContext,
  input: InvoiceReviewApprovalInput,
): Promise<string> {
  await requireFeature(context.companyId, "materials");

  if (!input.projectId) throw new Error("Επιλέξτε έργο.");
  if (!input.supplierId) {
    throw new Error(
      "Δεν βρέθηκε αποθηκευμένος προμηθευτής με αυτό το ΑΦΜ. Προσθέστε ή επιλέξτε προμηθευτή πριν την έγκριση.",
    );
  }
  if (!input.invoiceNumber) throw new Error("Συμπληρώστε αριθμό τιμολογίου.");

  const supplier = await getSupplierById(context.companyId, input.supplierId);

  if (!supplier || !supplier.active) {
    throw new Error(
      "Δεν βρέθηκε αποθηκευμένος προμηθευτής με αυτό το ΑΦΜ. Προσθέστε ή επιλέξτε προμηθευτή πριν την έγκριση.",
    );
  }

  const materialInput = {
    monthId: input.monthId,
    projectId: input.projectId,
    invoiceDate: input.invoiceDate,
  };

  try {
    await validateMaterialRelations(context.companyId, materialInput);
    await checkDuplicateMaterialInvoice({
      companyId: context.companyId,
      supplierName: supplier.name,
      supplierVat: supplier.tax_id,
      invoiceNumber: input.invoiceNumber,
    });
  } catch (error) {
    throw mapLockedMonthError(error);
  }

  const normalizedPaidAmount = Math.min(input.paidAmount, input.totalAmount);
  const paymentStatus =
    normalizedPaidAmount <= 0
      ? "pending"
      : Math.abs(normalizedPaidAmount - input.totalAmount) <= 0.01
        ? "paid"
        : "partial";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .insert({
      company_id: context.companyId,
      month_id: input.monthId,
      project_id: input.projectId,
      supplier_id: supplier.id,
      invoice_date: input.invoiceDate,
      supplier_name: supplier.name,
      supplier_vat: supplier.tax_id,
      invoice_number: input.invoiceNumber,
      description: input.description,
      net_amount: input.netAmount,
      vat_amount: input.vatAmount,
      total_amount: input.totalAmount,
      paid_amount: normalizedPaidAmount,
      payment_status: paymentStatus,
      notes: input.notes,
      created_by: context.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ai-invoices:review:approveMaterial] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατή η καταχώρηση στα Υλικά.");
  }

  return data.id;
}

async function approveAsExpense(
  context: ReviewContext,
  input: InvoiceReviewApprovalInput,
): Promise<string> {
  await requireFeature(context.companyId, "expenses");

  const expenseInput = {
    monthId: input.monthId,
    expenseDate: input.invoiceDate,
    scope: "general" as const,
    category: input.expenseCategory ?? "other",
    expenseSubtype: input.expenseSubtype,
    officeId: null,
    vehicleId: null,
    allocationMethod: input.allocationMethod,
  };

  try {
    await validateExpenseRelations(context.companyId, expenseInput);
  } catch (error) {
    throw mapLockedMonthError(error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      company_id: context.companyId,
      month_id: input.monthId,
      expense_date: input.invoiceDate,
      scope: "general",
      category: input.expenseCategory ?? "other",
      expense_subtype: input.expenseSubtype,
      description: input.description ?? input.invoiceNumber,
      amount: input.totalAmount,
      allocation_method: input.allocationMethod,
      allocation_status: "pending",
      notes: input.notes,
      created_by: context.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ai-invoices:review:approveExpense] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατή η καταχώρηση στα Έξοδα.");
  }

  return data.id;
}

async function approveAsRevenue(
  context: ReviewContext,
  input: InvoiceReviewApprovalInput,
): Promise<string> {
  await requireFeature(context.companyId, "revenues");

  if (!input.projectId) throw new Error("Επιλέξτε έργο.");
  if (!input.clientName) throw new Error("Συμπληρώστε πελάτη.");

  const revenueInput = {
    monthId: input.monthId,
    projectId: input.projectId,
    revenueDate: input.invoiceDate,
    clientName: input.clientName,
    invoiceNumber: input.invoiceNumber,
    paymentMethod: input.paymentMethod,
    revenueType: input.revenueType,
    invoicedAmount: input.totalAmount,
    receivedAmount: input.paidAmount,
    remainingAmount: Math.max(input.totalAmount - input.paidAmount, 0),
    status: input.status,
    notes: input.notes,
  };

  let normalized;
  let projectClientName: string | null = null;
  try {
    const { project } = await validateRevenueRelations(
      context.companyId,
      revenueInput,
    );
    projectClientName = project.client_name?.trim() || null;
    normalized = normalizeRevenueInput(revenueInput);
    await checkDuplicateRevenueInvoice({
      companyId: context.companyId,
      invoiceNumber: input.invoiceNumber,
      revenueType: input.revenueType,
    });
  } catch (error) {
    throw mapLockedMonthError(error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revenues")
    .insert({
      company_id: context.companyId,
      month_id: input.monthId,
      project_id: input.projectId,
      revenue_date: input.invoiceDate,
      client_name: projectClientName ?? input.clientName,
      invoice_number: input.invoiceNumber,
      payment_method: input.paymentMethod,
      revenue_type: input.revenueType,
      invoiced_amount: normalized.invoicedAmount,
      received_amount: normalized.receivedAmount,
      remaining_amount: normalized.remainingAmount,
      status: normalized.status,
      notes: input.notes,
      created_by: context.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ai-invoices:review:approveRevenue] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατή η καταχώρηση στα Έσοδα.");
  }

  return data.id;
}

async function finalizeApprovedReview(input: {
  context: ReviewContext;
  review: LoadedReview;
  approvalInput: InvoiceReviewApprovalInput;
  createdRecordId: string;
}) {
  const supabase = await createClient();
  const reviewedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("invoice_review_queue")
    .update({
      status: "approved",
      reviewed_by: input.context.userId,
      reviewed_at: reviewedAt,
    })
    .eq("company_id", input.context.companyId)
    .eq("id", input.review.id)
    .in("status", [...finalizableReviewStatuses])
    .select("id")
    .single();

  if (error || !data) {
    console.error("[ai-invoices:review:markApproved] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("Δεν ήταν δυνατή η έγκριση του τιμολογίου.");
  }

  await supabase
    .from("invoice_documents")
    .update({ status: "completed" })
    .eq("company_id", input.context.companyId)
    .eq("id", input.review.invoice_document_id);

  await writeAuditLog({
    companyId: input.context.companyId,
    action: "invoice_review.approved",
    entityType: "invoice_review_queue",
    entityId: input.review.id,
    metadata: {
      targetType: input.approvalInput.targetType,
      createdRecordId: input.createdRecordId,
      extractedInvoiceId: input.review.extractedInvoiceId,
    },
  });
}

export async function saveInvoiceReviewCorrections(
  formData: FormData,
): Promise<InvoiceActionState> {
  let context: ReviewContext;

  try {
    context = await requireInvoiceReviewContext();
  } catch (error) {
    console.error("[ai-invoices:review:correctionAccess]", error);
    return {
      ok: false,
      message: "Δεν έχετε δικαίωμα πρόσβασης στα AI Τιμολόγια.",
    };
  }

  const validation = invoiceReviewApprovalSchema.safeParse({
    reviewId: formData.get("reviewId"),
    targetType: formData.get("targetType"),
    monthId: formData.get("monthId"),
    projectId: formData.get("projectId"),
    supplierId: formData.get("supplierId"),
    supplierName: formData.get("supplierName"),
    supplierVat: formData.get("supplierVat"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    netAmount: formData.get("netAmount"),
    vatAmount: formData.get("vatAmount"),
    totalAmount: formData.get("totalAmount"),
    paidAmount: formData.get("paidAmount"),
    paymentStatus: formData.get("paymentStatus"),
    description: formData.get("description"),
    notes: formData.get("notes"),
    expenseCategory: formData.get("expenseCategory"),
    expenseSubtype: formData.get("expenseSubtype"),
    allocationMethod: formData.get("allocationMethod"),
    clientName: formData.get("clientName"),
    revenueType: formData.get("revenueType"),
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του τιμολογίου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  try {
    const review = await loadReviewItem(context.companyId, validation.data.reviewId);

    if (!review) {
      return { ok: false, message: "Το τιμολόγιο προς έλεγχο δεν βρέθηκε." };
    }

    if (review.status === "approved") {
      return { ok: false, message: "Το τιμολόγιο έχει ήδη εγκριθεί." };
    }

    await saveCorrectedExtraction(
      context.companyId,
      validation.data,
      review.extractedInvoiceId,
    );
    await markReviewCorrected(context.companyId, review.id);
    await writeAuditLog({
      companyId: context.companyId,
      action: "invoice_review.corrected",
      entityType: "invoice_review_queue",
      entityId: review.id,
      metadata: { targetType: validation.data.targetType },
    });

    revalidatePath("/expenses");
    revalidatePath("/materials");
    revalidatePath("/ai-invoices");
    return { ok: true, message: "Οι διορθώσεις αποθηκεύτηκαν." };
  } catch (error) {
    console.error("[ai-invoices:review:saveCorrections]", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Δεν ήταν δυνατή η αποθήκευση διορθώσεων.",
    };
  }
}

export async function approveInvoiceReview(
  formData: FormData,
): Promise<InvoiceActionState> {
  let context: ReviewContext;

  try {
    context = await requireInvoiceReviewContext();
  } catch (error) {
    console.error("[ai-invoices:review:approveAccess]", error);
    return {
      ok: false,
      message: "Δεν έχετε δικαίωμα πρόσβασης στα AI Τιμολόγια.",
    };
  }

  const validation = invoiceReviewApprovalSchema.safeParse({
    reviewId: formData.get("reviewId"),
    targetType: formData.get("targetType"),
    monthId: formData.get("monthId"),
    projectId: formData.get("projectId"),
    supplierId: formData.get("supplierId"),
    supplierName: formData.get("supplierName"),
    supplierVat: formData.get("supplierVat"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    netAmount: formData.get("netAmount"),
    vatAmount: formData.get("vatAmount"),
    totalAmount: formData.get("totalAmount"),
    paidAmount: formData.get("paidAmount"),
    paymentStatus: formData.get("paymentStatus"),
    description: formData.get("description"),
    notes: formData.get("notes"),
    expenseCategory: formData.get("expenseCategory"),
    expenseSubtype: formData.get("expenseSubtype"),
    allocationMethod: formData.get("allocationMethod"),
    clientName: formData.get("clientName"),
    revenueType: formData.get("revenueType"),
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του τιμολογίου.",
      fieldErrors: fieldErrors(validation),
    };
  }

  try {
    const review = await loadReviewItem(context.companyId, validation.data.reviewId);

    if (!review) {
      return { ok: false, message: "Το τιμολόγιο προς έλεγχο δεν βρέθηκε." };
    }

    if (review.status === "approved") {
      return { ok: false, message: "Το τιμολόγιο έχει ήδη εγκριθεί." };
    }

    if (!finalizableReviewStatuses.includes(review.status as never)) {
      return { ok: false, message: "Το τιμολόγιο δεν είναι διαθέσιμο για έγκριση." };
    }

    await saveCorrectedExtraction(
      context.companyId,
      validation.data,
      review.extractedInvoiceId,
    );

    await writeAuditLog({
      companyId: context.companyId,
      action: "invoice_review.approval_attempted",
      entityType: "invoice_review_queue",
      entityId: review.id,
      metadata: { targetType: validation.data.targetType },
    });

    const createdRecordId =
      validation.data.targetType === "material"
        ? await approveAsMaterial(context, validation.data)
        : validation.data.targetType === "expense"
          ? await approveAsExpense(context, validation.data)
          : await approveAsRevenue(context, validation.data);

    await finalizeApprovedReview({
      context,
      review,
      approvalInput: validation.data,
      createdRecordId,
    });

    revalidatePath("/expenses");
    revalidatePath("/materials");
    revalidatePath("/revenues");
    revalidatePath("/project-summary");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/ai-invoices");

    return {
      ok: true,
      message: "Το τιμολόγιο εγκρίθηκε και καταχωρήθηκε.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Δεν ήταν δυνατή η έγκριση.";

    await writeAuditLog({
      companyId: context.companyId,
      action: message.includes("διπλό")
        ? "invoice_review.approval_blocked_duplicate"
        : message.includes("κλειστό")
          ? "invoice_review.approval_blocked_locked_month"
          : "invoice_review.approval_failed",
      entityType: "invoice_review_queue",
      entityId: validation.data.reviewId,
      metadata: { message },
    });

    console.error("[ai-invoices:review:approve]", { message });
    return { ok: false, message };
  }
}

export async function rejectInvoiceReview(
  formData: FormData,
): Promise<InvoiceActionState> {
  let context: ReviewContext;

  try {
    context = await requireInvoiceReviewContext();
  } catch (error) {
    console.error("[ai-invoices:review:rejectAccess]", error);
    return {
      ok: false,
      message: "Δεν έχετε δικαίωμα πρόσβασης στα AI Τιμολόγια.",
    };
  }

  const validation = invoiceReviewRejectSchema.safeParse({
    reviewId: formData.get("reviewId"),
    rejectionReason: formData.get("rejectionReason"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: validation.error.flatten().fieldErrors.rejectionReason?.[0],
    };
  }

  try {
    const review = await loadReviewItem(context.companyId, validation.data.reviewId);

    if (!review) {
      return { ok: false, message: "Το τιμολόγιο προς έλεγχο δεν βρέθηκε." };
    }

    if (review.status === "approved") {
      return { ok: false, message: "Το τιμολόγιο έχει ήδη εγκριθεί." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("invoice_review_queue")
      .update({
        status: "rejected",
        rejection_reason: validation.data.rejectionReason,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("company_id", context.companyId)
      .eq("id", review.id);

    if (error) {
      console.error("[ai-invoices:review:reject] Supabase error", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error("Δεν ήταν δυνατή η απόρριψη.");
    }

    await supabase
      .from("invoice_documents")
      .update({ status: "rejected" })
      .eq("company_id", context.companyId)
      .eq("id", review.invoice_document_id);

    await writeAuditLog({
      companyId: context.companyId,
      action: "invoice_review.rejected",
      entityType: "invoice_review_queue",
      entityId: review.id,
      metadata: { rejectionReason: validation.data.rejectionReason },
    });

    revalidatePath("/expenses");
    revalidatePath("/materials");
    revalidatePath("/ai-invoices");
    return { ok: true, message: "Το τιμολόγιο απορρίφθηκε." };
  } catch (error) {
    console.error("[ai-invoices:review:reject]", error);
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Δεν ήταν δυνατή η απόρριψη.",
    };
  }
}
