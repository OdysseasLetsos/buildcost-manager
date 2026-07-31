"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/src/core/auth";
import { writeAuditLog } from "@/src/core/audit";
import { requireFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { createClient } from "@/src/integrations/supabase/server";
import type { ProjectActionState } from "../types";
import { getProjectById } from "../services/get-project-by-id";
import { projectIdSchema } from "../validators";

const linkedRecordsBlockedMessage =
  "Το έργο δεν μπορεί να διαγραφεί γιατί υπάρχουν συνδεδεμένες καταχωρήσεις. Μπορείτε να το αρχειοθετήσετε.";

type LinkedRecordTable =
  | "daily_work_entries"
  | "materials"
  | "revenues"
  | "project_quotes"
  | "employee_project_contracts";

async function countLinkedRecords(
  table: LinkedRecordTable,
  companyId: string,
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("project_id", projectId);

  if (error) {
    console.error("[projects:deleteProject:linkedRecords] Supabase error", {
      table,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Unable to check linked project records.");
  }

  return count ?? 0;
}

async function hasLinkedProjectRecords(
  companyId: string,
  projectId: string,
): Promise<boolean> {
  const tables: LinkedRecordTable[] = [
    "daily_work_entries",
    "materials",
    "revenues",
    "project_quotes",
    "employee_project_contracts",
  ];

  const counts = await Promise.all(
    tables.map((table) => countLinkedRecords(table, companyId, projectId)),
  );

  return counts.some((count) => count > 0);
}

export async function deleteProject(
  projectIdValue: string,
): Promise<ProjectActionState> {
  const user = await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return { ok: false, message: "Δεν βρέθηκε ενεργή εταιρεία." };
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);
  await requireRole(companyId, ["owner", "admin"]);
  await requireFeature(companyId, "projects");

  const projectId = projectIdSchema.safeParse(projectIdValue);

  if (!projectId.success) {
    return { ok: false, message: "Το έργο δεν είναι έγκυρο." };
  }

  const existingProject = await getProjectById(companyId, projectId.data);

  if (!existingProject) {
    return { ok: false, message: "Το έργο δεν βρέθηκε." };
  }

  try {
    if (await hasLinkedProjectRecords(companyId, projectId.data)) {
      await writeAuditLog({
        companyId,
        action: "project.delete_blocked",
        entityType: "project",
        entityId: projectId.data,
        metadata: {
          code: existingProject.code,
          name: existingProject.name,
          reason: "linked_records",
        },
      });

      return { ok: false, message: linkedRecordsBlockedMessage };
    }
  } catch {
    return {
      ok: false,
      message: "Δεν ήταν δυνατός ο έλεγχος των συνδεδεμένων καταχωρήσεων.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("company_id", companyId)
    .eq("id", projectId.data);

  if (error) {
    console.error("[projects:deleteProject] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { ok: false, message: "Δεν ήταν δυνατή η διαγραφή του έργου." };
  }

  await writeAuditLog({
    companyId,
    action: "project.deleted",
    entityType: "project",
    entityId: projectId.data,
    metadata: {
      code: existingProject.code,
      name: existingProject.name,
      deletedBy: user.id,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/project-summary");

  return { ok: true, message: "Το έργο διαγράφηκε επιτυχώς." };
}
