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
import {
  isAllowedProjectStatusTransition,
  toStoredProjectStatus,
  type ProjectActionState,
} from "../types";
import { getManagedProjectById } from "../services/get-project-by-id";
import {
  normalizeProjectDates,
  projectIdSchema,
  projectInputSchema,
} from "../validators";

function mapValidationErrors(
  validation: ReturnType<typeof projectInputSchema.safeParse>,
): ProjectActionState["fieldErrors"] {
  if (validation.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(validation.error.flatten().fieldErrors).map(
      ([field, messages]) => [field, messages?.[0]],
    ),
  );
}

function duplicateCodeMessage(code?: string): string {
  return code === "23505"
    ? "Υπάρχει ήδη έργο με αυτόν τον κωδικό."
    : "Δεν ήταν δυνατή η ενημέρωση του έργου.";
}

export async function updateProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin", "office"]);
  await requireFeature(companyId, "projects");

  const projectId = projectIdSchema.safeParse(formData.get("projectId"));

  if (!projectId.success) {
    return { ok: false, message: "Το έργο δεν είναι έγκυρο." };
  }

  const existingProject = await getManagedProjectById(companyId, projectId.data);

  if (!existingProject) {
    return { ok: false, message: "Το έργο δεν βρέθηκε." };
  }

  const validation = projectInputSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    location: formData.get("location"),
    status: formData.get("status"),
    budgetAmount: formData.get("budgetAmount"),
    offerDate: formData.get("offerDate") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    cancellationDate: formData.get("cancellationDate") ?? "",
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

  if (!isAllowedProjectStatusTransition(existingProject.status, input.status)) {
    return {
      ok: false,
      message: "Η συγκεκριμένη αλλαγή κατάστασης έργου δεν επιτρέπεται.",
      fieldErrors: {
        status: "Επιλέξτε την επόμενη επιτρεπτή κατάσταση του έργου.",
      },
    };
  }

  const dates = normalizeProjectDates(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      code: input.code,
      name: input.name,
      client_name: input.clientName,
      location: input.location,
      status: toStoredProjectStatus(input.status),
      budget_amount: input.budgetAmount,
      offer_date: dates.offerDate,
      start_date: dates.startDate,
      end_date: dates.endDate,
      cancellation_date: dates.cancellationDate,
      notes: input.notes,
    })
    .eq("company_id", companyId)
    .eq("id", projectId.data);

  if (error) {
    console.error("[projects:updateProject] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: duplicateCodeMessage(error.code) };
  }

  await writeAuditLog({
    companyId,
    action: "project.updated",
    entityType: "project",
    entityId: projectId.data,
    metadata: {
      previousCode: existingProject.code,
      nextCode: input.code,
      name: input.name,
    },
  });

  revalidatePath("/projects");

  return { ok: true, message: "Το έργο ενημερώθηκε." };
}
