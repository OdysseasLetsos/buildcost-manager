import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { ProjectsPageClient } from "@/src/features/projects/components/ProjectsPageClient";
import { getProjectQuotes } from "@/src/features/projects/services/get-project-quotes";
import { getManagedProjects } from "@/src/features/projects/services/get-projects";

export default async function ProjectsPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [projects, quotes, featureAvailable] = await Promise.all([
    getManagedProjects(companyId),
    getProjectQuotes(companyId),
    canUseFeature(companyId, "projects"),
  ]);

  let canManage = false;
  let canDelete = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canManage = true;
  } catch {
    canManage = false;
  }

  try {
    await requireRole(companyId, ["owner", "admin"]);
    canDelete = true;
  } catch {
    canDelete = false;
  }

  return (
    <ProjectsPageClient
      projects={projects}
      quotes={quotes}
      canManage={canManage}
      canDelete={canDelete}
      featureAvailable={featureAvailable}
    />
  );
}
