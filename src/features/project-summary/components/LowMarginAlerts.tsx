"use client";

import { useTranslation } from "@/src/shared/i18n";
import type { ProjectSummaryRow, ProjectSummaryWarning } from "../types";

export function LowMarginAlerts({
  projects,
  warnings,
}: Readonly<{
  projects: ProjectSummaryRow[];
  warnings: ProjectSummaryWarning[];
}>) {
  const { t } = useTranslation();
  const statusMessages = {
    loss: t("projectSummary.lossMessage"),
    low_margin: t("projectSummary.lowMarginMessage"),
    no_revenue: t("projectSummary.noRevenueMessage"),
  } as const;
  const alertProjects = projects.filter((project) =>
    ["loss", "low_margin", "no_revenue"].includes(project.status),
  );

  if (alertProjects.length === 0 && warnings.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-amber-950">
        {t("projectSummary.alerts")}
      </h3>
      {alertProjects.map((project) => (
        <p key={project.projectId} className="text-sm text-amber-900">
          <span className="font-semibold">{project.projectCode} - {project.projectName}</span>:{" "}
          {statusMessages[project.status as keyof typeof statusMessages]}
        </p>
      ))}
      {warnings.map((warning) => (
        <p
          key={`${warning.type}-${warning.entityName ?? ""}-${warning.message}`}
          className="text-sm text-amber-900"
        >
          {warning.entityName ? (
            <span className="font-semibold">{warning.entityName}: </span>
          ) : null}
          {warning.message}
        </p>
      ))}
    </section>
  );
}
