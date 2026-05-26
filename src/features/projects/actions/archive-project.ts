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
import { getProjectById } from "../services/get-project-by-id";
import { projectIdSchema } from "../validators";

export async function archiveProject(
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

  const existingProject = await getProjectById(companyId, projectId.data);

  if (!existingProject) {
    return { ok: false, message: "Το έργο δεν βρέθηκε." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("company_id", companyId)
    .eq("id", projectId.data);

  if (error) {
    console.error("[projects:archiveProject] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η αρχειοθέτηση του έργου." };
  }

  await writeAuditLog({
    companyId,
    action: "project.archived",
    entityType: "project",
    entityId: projectId.data,
    metadata: { code: existingProject.code, name: existingProject.name },
  });

  revalidatePath("/projects");

  return { ok: true, message: "Το έργο αρχειοθετήθηκε." };
}
