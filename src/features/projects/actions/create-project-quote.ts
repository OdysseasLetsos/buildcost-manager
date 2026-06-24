"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { projectQuoteInputSchema } from "../quote-validators";
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

function createQuoteNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ΠΡ-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createProjectQuote(
  formData: FormData,
): Promise<ProjectQuoteActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "projects");

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

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία της προσφοράς.",
      fieldErrors: mapFieldErrors(validation),
    };
  }

  const input = validation.data;
  const project = await getManagedProjectById(companyId, input.projectId);

  if (!project) {
    return { ok: false, message: "Το συνδεδεμένο έργο δεν βρέθηκε." };
  }

  if (project.status !== "in_progress") {
    return {
      ok: false,
      message: "Νέα προσφορά μπορεί να δημιουργηθεί μόνο για ενεργό έργο.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_quotes")
    .insert({
      company_id: companyId,
      project_id: project.id,
      quote_number: createQuoteNumber(),
      version: 1,
      quote_type: "supplemental",
      title: input.title,
      description: input.description,
      amount: input.amount,
      vat_amount: input.vatAmount,
      total_amount: input.totalAmount,
      quote_date: input.quoteDate,
      status: input.status,
      rejection_reason:
        input.status === "rejected" ? input.rejectionReason : null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[projects:createProjectQuote] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });

    return {
      ok: false,
      message: "Δεν ήταν δυνατή η αποθήκευση της προσφοράς.",
    };
  }

  const quote = data as ProjectQuote;
  await writeAuditLog({
    companyId,
    action: "project_quote.created",
    entityType: "project_quote",
    entityId: quote.id,
    metadata: {
      projectId: quote.project_id,
      quoteNumber: quote.quote_number,
      status: quote.status,
      totalAmount: quote.total_amount,
    },
  });

  if (quote.status !== "draft") {
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
        previousStatus: "draft",
        nextStatus: quote.status,
      },
    });
  }

  if (quote.status === "approved") {
    await writeAuditLog({
      companyId,
      action: "project_quote.approved_total_changed",
      entityType: "project_quote",
      entityId: quote.id,
      metadata: {
        projectId: quote.project_id,
        quoteNumber: quote.quote_number,
        previousApprovedAmount: 0,
        nextApprovedAmount: quote.total_amount,
      },
    });
  }

  revalidatePath("/projects");

  return {
    ok: true,
    message: "Η προσφορά αποθηκεύτηκε επιτυχώς.",
    quote,
  };
}
