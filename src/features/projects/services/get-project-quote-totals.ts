import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getManagedProjectById } from "./get-project-by-id";
import { getProjectQuotes } from "./get-project-quotes";
import { calculateProjectQuoteTotals } from "./calculate-project-quote-totals";
import type { ProjectQuoteTotals } from "../types";

export async function getProjectQuoteTotals(
  projectId: string,
): Promise<ProjectQuoteTotals> {
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new Error("Δεν βρέθηκε ενεργή εταιρεία.");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);

  const project = await getManagedProjectById(companyId, projectId);

  if (!project) {
    throw new Error("Το έργο δεν βρέθηκε.");
  }

  const quotes = await getProjectQuotes(companyId, project.id);
  return calculateProjectQuoteTotals(project.budget_amount, quotes);
}
