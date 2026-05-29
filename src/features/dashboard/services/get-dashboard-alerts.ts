import { getProjectSummary } from "@/src/features/project-summary/services/get-project-summary";
import type { DashboardAlert, DashboardMonthlyPeriod } from "../types";

const statusMessages = {
  loss: "Το έργο {project} εμφανίζει ζημιά.",
  low_margin: "Το έργο {project} έχει χαμηλό περιθώριο κέρδους.",
  no_revenue: "Το έργο {project} έχει κόστος αλλά δεν έχει έσοδα.",
} as const;

export async function getDashboardAlerts(
  companyId: string,
  selectedMonth: DashboardMonthlyPeriod | null,
): Promise<DashboardAlert[]> {
  if (!selectedMonth) return [];

  const report = await getProjectSummary(companyId, selectedMonth.id);
  const alerts: DashboardAlert[] = [];

  if (selectedMonth.status === "locked" || selectedMonth.is_locked) {
    alerts.push({
      id: "locked-month",
      tone: "blue",
      message: `Ο μήνας ${selectedMonth.month_key} είναι κλειδωμένος.`,
    });
  }

  for (const project of report.projects) {
    if (!["loss", "low_margin", "no_revenue"].includes(project.status)) continue;
    alerts.push({
      id: `project-${project.projectId}-${project.status}`,
      tone: project.status === "loss" ? "red" : "amber",
      message: statusMessages[project.status as keyof typeof statusMessages].replace(
        "{project}",
        `${project.projectCode} - ${project.projectName}`,
      ),
    });
  }

  for (const warning of report.warnings) {
    alerts.push({
      id: `warning-${warning.type}-${warning.entityName ?? ""}-${warning.message}`,
      tone: warning.type === "expenses" ? "amber" : "red",
      message: warning.message,
    });
  }

  return alerts.slice(0, 8);
}
