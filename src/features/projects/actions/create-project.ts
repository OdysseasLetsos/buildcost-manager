"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import {
  getCurrentCompany,
  requireCompanyMember,
} from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { ProjectActionState } from "../types";
import { projectInputSchema } from "../validators";

function mapValidationErrors(
  error: ReturnType<typeof projectInputSchema.safeParse>,
): ProjectActionState["fieldErrors"] {
  if (error.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.error.flatten().fieldErrors).map(([field, messages]) => [
      field,
      messages?.[0],
    ]),
  );
}

function duplicateCodeMessage(code?: string): string {
  return code === "23505"
    ? "Υπάρχει ήδη έργο με αυτόν τον κωδικό."
    : "Δεν ήταν δυνατή η δημιουργία του έργου.";
}

export async function createProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "projects");

  const validation = projectInputSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    location: formData.get("location"),
    status: formData.get("status"),
    budgetAmount: formData.get("budgetAmount"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    return {
      ok: false,
      message: "Ελέγξτε τα στοιχεία του έργου.",
      fieldErrors: mapValidationErrors(validation),
    };
  }

  const input = validation.data;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      company_id: companyId,
      code: input.code,
      name: input.name,
      client_name: input.clientName,
      location: input.location,
      status: input.status,
      budget_amount: input.budgetAmount,
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !project) {
    console.error("[projects:createProject] Supabase error", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });

    return { ok: false, message: duplicateCodeMessage(error?.code) };
  }

  await writeAuditLog({
    companyId,
    action: "project.created",
    entityType: "project",
    entityId: project.id,
    metadata: { code: input.code, name: input.name },
  });

  revalidatePath("/projects");

  return { ok: true, message: "Το έργο δημιουργήθηκε." };
}
