"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import {
  projectQuoteIdSchema,
  projectQuoteInputSchema,
} from "../quote-validators";
import { getManagedProjectById } from "../services/get-project-by-id";
import type { ProjectQuote, ProjectQuoteActionState } from "../types";

function mapFieldErrors(
  validation: ReturnType<typeof projectQuoteInputSchema.safeParse>,
): ProjectQuoteActionState["fieldErrors"] {
  if (validation.success) return {};

  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(
      ([field, messages]) => [field, messages?.[0]],
    ),
  );
}

export async function updateProjectQuote(
  formData: FormData,
): Promise<ProjectQuoteActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "projects");

  const quoteId = projectQuoteIdSchema.safeParse(formData.get("quoteId"));
  const validation = projectQuoteInputSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    vatAmount: formData.get("vatAmount"),
    totalAmount: formData.get("totalAmount"),
    quoteDate: formData.get("quoteDate"),
    status: formData.get("status"),
    rejectionReason: formData.get("rejectionReason") ?? "",
  });

  if (!quoteId.success || !validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία της προσφοράς.",
      fieldErrors: mapFieldErrors(validation),
    };
  }

  const input = validation.data;
  const project = await getManagedProjectById(companyId, input.projectId);

  if (!project || project.status !== "in_progress") {
    return {
      ok: false,
      message: "Η προσφορά δεν μπορεί να τροποποιηθεί για αυτό το έργο.",
    };
  }

  const supabase = await createClient();
  const { data: existingQuote, error: existingError } = await supabase
    .from("project_quotes")
    .select("*")
    .eq("company_id", companyId)
    .eq("project_id", project.id)
    .eq("id", quoteId.data)
    .maybeSingle();

  if (existingError || !existingQuote) {
    console.error("[projects:updateProjectQuote:load] Supabase error", {
      message: existingError?.message,
      code: existingError?.code,
      details: existingError?.details,
      hint: existingError?.hint,
    });
    return { ok: false, message: "Η προσφορά δεν βρέθηκε." };
  }

  const approvedAmountsChanged =
    existingQuote.status === "approved" &&
    (existingQuote.amount !== input.amount ||
      existingQuote.vat_amount !== input.vatAmount ||
      existingQuote.total_amount !== input.totalAmount);

  if (approvedAmountsChanged) {
    return {
      ok: false,
      message:
        "Τα ποσά εγκεκριμένης προσφοράς δεν μπορούν να αλλάξουν. Δημιουργήστε νέα έκδοση ή αναθεώρηση.",
      fieldErrors: {
        amount: "Το ποσό εγκεκριμένης προσφοράς είναι κλειδωμένο.",
        vatAmount: "Ο ΦΠΑ εγκεκριμένης προσφοράς είναι κλειδωμένος.",
        totalAmount: "Το συνολικό ποσό εγκεκριμένης προσφοράς είναι κλειδωμένο.",
      },
    };
  }

  const { data, error } = await supabase
    .from("project_quotes")
    .update({
      title: input.title,
      description: input.description,
      amount: input.amount,
      vat_amount: input.vatAmount,
      total_amount: input.totalAmount,
      quote_date: input.quoteDate,
      status: input.status,
      rejection_reason:
        input.status === "rejected" ? input.rejectionReason : null,
    })
    .eq("company_id", companyId)
    .eq("project_id", project.id)
    .eq("id", quoteId.data)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[projects:updateProjectQuote] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return {
      ok: false,
      message: "Δεν ήταν δυνατή η ενημέρωση της προσφοράς.",
    };
  }

  const quote = data as ProjectQuote;
  await writeAuditLog({
    companyId,
    action: "project_quote.updated",
    entityType: "project_quote",
    entityId: quote.id,
    metadata: {
      projectId: quote.project_id,
      quoteNumber: quote.quote_number,
      previousStatus: existingQuote.status,
      nextStatus: quote.status,
      totalAmount: quote.total_amount,
    },
  });

  if (existingQuote.status !== quote.status) {
    const statusAction =
      quote.status === "approved"
        ? "project_quote.approved"
        : quote.status === "rejected"
          ? "project_quote.rejected"
          : quote.status === "revised"
            ? "project_quote.revised"
            : quote.status === "cancelled"
              ? "project_quote.cancelled"
              : "project_quote.status_changed";

    await writeAuditLog({
      companyId,
      action: statusAction,
      entityType: "project_quote",
      entityId: quote.id,
      metadata: {
        projectId: quote.project_id,
        quoteNumber: quote.quote_number,
        previousStatus: existingQuote.status,
        nextStatus: quote.status,
      },
    });

    if (
      existingQuote.status === "approved" ||
      quote.status === "approved"
    ) {
      await writeAuditLog({
        companyId,
        action: "project_quote.approved_total_changed",
        entityType: "project_quote",
        entityId: quote.id,
        metadata: {
          projectId: quote.project_id,
          quoteNumber: quote.quote_number,
          previousStatus: existingQuote.status,
          nextStatus: quote.status,
          previousApprovedAmount:
            existingQuote.status === "approved"
              ? existingQuote.total_amount
              : 0,
          nextApprovedAmount:
            quote.status === "approved" ? quote.total_amount : 0,
        },
      });
    }
  }

  revalidatePath("/projects");
  return {
    ok: true,
    message: "Η προσφορά ενημερώθηκε επιτυχώς.",
    quote,
  };
}
