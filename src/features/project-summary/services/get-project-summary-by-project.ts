import type { ProjectSummaryReport, ProjectSummaryRow } from "../types";

export function getProjectSummaryByProject(
  report: ProjectSummaryReport,
  projectId: string,
): ProjectSummaryRow | null {
  return report.projects.find((project) => project.projectId === projectId) ?? null;
}
