import Link from "next/link";
import type {
  DashboardDailyWorkProjectTotals,
  DashboardFinancialProject,
  DashboardProject,
} from "../types";
import { DashboardProjectCard } from "./DashboardProjectCard";

export function ActiveProjectsSection({
  projects,
  projectTotals,
  financialProjects,
  canViewFinancials,
}: Readonly<{
  projects: DashboardProject[];
  projectTotals: DashboardDailyWorkProjectTotals[];
  financialProjects: DashboardFinancialProject[];
  canViewFinancials: boolean;
}>) {
  const totalsByProjectId = new Map(projectTotals.map((totals) => [totals.projectId, totals]));
  const financialByProjectId = new Map(
    financialProjects.map((project) => [project.projectId, project]),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Έργα</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Ενεργά Έργα</h2>
        </div>
        <Link href="/projects" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          Προβολή όλων
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <DashboardProjectCard
              key={project.id}
              project={project}
              workTotals={totalsByProjectId.get(project.id)}
              financialProject={financialByProjectId.get(project.id)}
              canViewFinancials={canViewFinancials}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-950">Δεν υπάρχουν ενεργά έργα</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Δημιουργήστε έργα για να εμφανίζονται εδώ οι βασικές πληροφορίες και η παρακολούθησή τους.
          </p>
        </div>
      )}
    </section>
  );
}
