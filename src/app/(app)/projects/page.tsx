import { redirect } from "next/navigation";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany } from "@/src/core/tenants";
import { ProjectsPageClient } from "@/src/features/projects/components/ProjectsPageClient";
import { getProjects } from "@/src/features/projects/services/get-projects";

export default async function ProjectsPage() {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [projects, featureAvailable] = await Promise.all([
    getProjects(companyId),
    canUseFeature(companyId, "projects"),
  ]);

  let canManage = false;

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canManage = true;
  } catch {
    canManage = false;
  }

  return (
    <ProjectsPageClient
      projects={projects}
      canManage={canManage}
      featureAvailable={featureAvailable}
    />
  );
}
