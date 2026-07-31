"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../actions/create-project";
import { deleteProject } from "../actions/delete-project";
import { updateProject } from "../actions/update-project";
import { calculateProjectQuoteTotals } from "../services/calculate-project-quote-totals";
import type {
  ManagedProject,
  ProjectQuote,
  ProjectQuoteTotals,
  ProjectStatus,
} from "../types";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectForm } from "./ProjectForm";
import { ProjectsTable } from "./ProjectsTable";

function projectMatchesSearch(project: ManagedProject, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    project.code,
    project.name,
    project.client_name,
    project.location,
  ].some((value) => value?.toLowerCase().includes(normalizedSearch));
}

export function ProjectsPageClient({
  projects,
  quotes,
  canManage,
  canDelete,
  featureAvailable,
}: Readonly<{
  projects: ManagedProject[];
  quotes: ProjectQuote[];
  canManage: boolean;
  canDelete: boolean;
  featureAvailable: boolean;
}>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] =
    useState<ManagedProject | null>(null);

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          projectMatchesSearch(project, search) &&
          (status === "all" || project.status === status),
      ),
    [projects, search, status],
  );
  const quoteTotalsByProject = useMemo(
    () =>
      projects.reduce<Record<string, ProjectQuoteTotals>>((totals, project) => {
        totals[project.id] = calculateProjectQuoteTotals(
          project.budget_amount,
          quotes.filter((quote) => quote.project_id === project.id),
        );
        return totals;
      }, {}),
    [projects, quotes],
  );

  function handleMutationSuccess() {
    setShowCreateForm(false);
    setEditingProject(null);
    router.refresh();
  }

  const canMutateProjects = canManage && featureAvailable;
  const canDeleteProjects = canDelete && featureAvailable;
  const editingProjectQuotes = editingProject
    ? quotes.filter((quote) => quote.project_id === editingProject.id)
    : [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Έργα</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχείριση και παρακολούθηση όλων των έργων της εταιρείας.
          </p>
        </div>

        {canMutateProjects ? (
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setShowCreateForm((value) => !value);
            }}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Νέο Έργο
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Η λειτουργία έργων δεν είναι διαθέσιμη στο τρέχον πακέτο.
        </section>
      ) : null}

      {featureAvailable && !canManage ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Έχετε πρόσβαση προβολής στα έργα. Οι αλλαγές επιτρέπονται μόνο σε
          ιδιοκτήτες, διαχειριστές και γραφείο.
        </section>
      ) : null}

      {showCreateForm && canMutateProjects ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Νέο Έργο</h3>
          <div className="mt-5">
            <ProjectForm
              action={createProject}
              submitLabel="Δημιουργία Έργου"
              onSuccess={handleMutationSuccess}
            />
          </div>
        </section>
      ) : null}

      {editingProject && canMutateProjects ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-950">
              Επεξεργασία Έργου
            </h3>
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Κλείσιμο
            </button>
          </div>
          <div className="mt-5">
            <ProjectForm
              key={editingProject.id}
              action={updateProject}
              project={editingProject}
              quotes={editingProjectQuotes}
              submitLabel="Αποθήκευση Αλλαγών"
              onSuccess={handleMutationSuccess}
            />
          </div>
        </section>
      ) : null}

      <ProjectFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <ProjectsTable
        projects={filteredProjects}
        quoteTotalsByProject={quoteTotalsByProject}
        canManage={canMutateProjects}
        canDelete={canDeleteProjects}
        onEditProject={(project) => {
          setShowCreateForm(false);
          setEditingProject(project);
        }}
        onDeleteProject={deleteProject}
        onDeleteSuccess={handleMutationSuccess}
      />
    </div>
  );
}
