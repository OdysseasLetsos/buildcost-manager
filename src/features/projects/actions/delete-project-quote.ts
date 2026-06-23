"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import { projectQuoteIdSchema } from "../quote-validators";
import { getManagedProjectById } from "../services/get-project-by-id";
import type { ProjectQuoteActionState } from "../types";

export async function deleteProjectQuote(
  quoteIdValue: string,
  projectIdValue: string,
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

  const quoteId = projectQuoteIdSchema.safeParse(quoteIdValue);
  const projectId = projectQuoteIdSchema.safeParse(projectIdValue);

  if (!quoteId.success || !projectId.success) {
    return { ok: false, message: "Η προσφορά δεν είναι έγκυρη." };
  }

  const project = await getManagedProjectById(companyId, projectId.data);

  if (!project || project.status !== "in_progress") {
    return {
      ok: false,
      message: "Η προσφορά δεν μπορεί να διαγραφεί για αυτό το έργο.",
    };
  }

  const supabase = await createClient();
  const { data: quote, error: loadError } = await supabase
    .from("project_quotes")
    .select("id, project_id, quote_number, status")
    .eq("company_id", companyId)
    .eq("project_id", project.id)
    .eq("id", quoteId.data)
    .maybeSingle();

  if (loadError || !quote) {
    console.error("[projects:deleteProjectQuote:load] Supabase error", {
      message: loadError?.message,
      code: loadError?.code,
      details: loadError?.details,
      hint: loadError?.hint,
    });
    return { ok: false, message: "Η προσφορά δεν βρέθηκε." };
  }

  if (quote.status === "approved") {
    return {
      ok: false,
      message:
        "Η εγκεκριμένη προσφορά δεν μπορεί να διαγραφεί. Μπορεί να ακυρωθεί ή να δημιουργηθεί νέα έκδοση.",
    };
  }

  const { error } = await supabase
    .from("project_quotes")
    .delete()
    .eq("company_id", companyId)
    .eq("project_id", project.id)
    .eq("id", quote.id);

  if (error) {
    console.error("[projects:deleteProjectQuote] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return {
      ok: false,
      message: "Δεν ήταν δυνατή η διαγραφή της προσφοράς.",
    };
  }

  await writeAuditLog({
    companyId,
    action: "project_quote.deleted",
    entityType: "project_quote",
    entityId: quote.id,
    metadata: {
      projectId: quote.project_id,
      quoteNumber: quote.quote_number,
      previousStatus: quote.status,
    },
  });

  revalidatePath("/projects");
  return {
    ok: true,
    message: "Η προσφορά διαγράφηκε επιτυχώς.",
  };
}
