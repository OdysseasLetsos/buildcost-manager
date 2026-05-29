"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import { createRevenue } from "../actions/create-revenue";
import { updateRevenue } from "../actions/update-revenue";
import { getRevenuesByProject } from "../services/get-revenues-by-project";
import { getRevenuesSummary } from "../services/get-revenues-summary";
import type { RevenueWithRelations } from "../types";
import { RevenueFilters } from "./RevenueFilters";
import { RevenueForm } from "./RevenueForm";
import { RevenuesByProjectChart } from "./RevenuesByProjectChart";
import { RevenuesSummaryCards } from "./RevenuesSummaryCards";
import { RevenuesTable } from "./RevenuesTable";

function filterRevenues(
  revenues: RevenueWithRelations[],
  filters: {
    monthId: string;
    projectId: string;
    clientName: string;
    revenueType: string;
    status: string;
    search: string;
  },
) {
  const client = filters.clientName.trim().toLowerCase();
  const search = filters.search.trim().toLowerCase();
  return revenues.filter(
    (revenue) =>
      (!filters.monthId || revenue.month_id === filters.monthId) &&
      (!filters.projectId || revenue.project_id === filters.projectId) &&
      (!filters.revenueType || revenue.revenue_type === filters.revenueType) &&
      (!filters.status || revenue.status === filters.status) &&
      (!client || revenue.client_name.toLowerCase().includes(client)) &&
      (!search ||
        revenue.client_name.toLowerCase().includes(search) ||
        (revenue.invoice_number ?? "").toLowerCase().includes(search) ||
        (revenue.notes ?? "").toLowerCase().includes(search)),
  );
}

export function RevenuesPageClient({
  revenues,
  monthlyPeriods,
  projects,
  defaultMonthId,
  canManage,
  featureAvailable,
}: Readonly<{
  revenues: RevenueWithRelations[];
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  defaultMonthId: string;
  canManage: boolean;
  featureAvailable: boolean;
}>) {
  const router = useRouter();
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [projectId, setProjectId] = useState("");
  const [clientName, setClientName] = useState("");
  const [revenueType, setRevenueType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<RevenueWithRelations | null>(null);

  const effectiveMonthId = monthId || defaultMonthId;
  const selectedMonth = monthlyPeriods.find((period) => period.id === effectiveMonthId);
  const selectedMonthLocked =
    selectedMonth?.status === "locked" || selectedMonth?.is_locked === true;
  const openMonthlyPeriods = monthlyPeriods.filter(
    (period) => period.status === "open" && !period.is_locked,
  );
  const lockedMonthIds = useMemo(
    () =>
      monthlyPeriods
        .filter((period) => period.status === "locked" || period.is_locked)
        .map((period) => period.id),
    [monthlyPeriods],
  );
  const filteredRevenues = useMemo(
    () =>
      filterRevenues(revenues, {
        monthId: effectiveMonthId,
        projectId,
        clientName,
        revenueType,
        status,
        search,
      }),
    [clientName, effectiveMonthId, projectId, revenueType, revenues, search, status],
  );
  const summary = useMemo(() => getRevenuesSummary(filteredRevenues), [filteredRevenues]);
  const byProject = useMemo(
    () => getRevenuesByProject(filteredRevenues),
    [filteredRevenues],
  );
  const activeProjects = projects.filter((project) => project.status !== "archived");
  const canMutate = canManage && featureAvailable && !selectedMonthLocked;

  function handleSuccess() {
    setShowForm(false);
    setEditingRevenue(null);
    router.refresh();
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Έσοδα</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχείριση εσόδων, τιμολογίων και εισπράξεων ανά έργο.
          </p>
        </div>
        {canMutate ? (
          <button
            type="button"
            onClick={() => {
              setEditingRevenue(null);
              setShowForm((value) => !value);
            }}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Νέο Έσοδο
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Έσοδα.
        </section>
      ) : null}

      {selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      <RevenuesSummaryCards summary={summary} />

      <RevenueFilters
        monthId={monthId}
        projectId={projectId}
        clientName={clientName}
        revenueType={revenueType}
        status={status}
        search={search}
        monthlyPeriods={monthlyPeriods}
        projects={projects}
        onMonthChange={setMonthId}
        onProjectChange={setProjectId}
        onClientChange={setClientName}
        onTypeChange={setRevenueType}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />

      {(showForm || editingRevenue) && canMutate ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <RevenueForm
            action={editingRevenue ? updateRevenue : createRevenue}
            revenue={editingRevenue ?? undefined}
            monthlyPeriods={openMonthlyPeriods}
            projects={activeProjects}
            defaultMonthId={effectiveMonthId}
            submitLabel={editingRevenue ? "Αποθήκευση Αλλαγών" : "Δημιουργία Εσόδου"}
            onSuccess={handleSuccess}
          />
        </section>
      ) : null}

      <RevenuesTable
        revenues={filteredRevenues}
        canManage={canManage && featureAvailable}
        lockedMonthIds={lockedMonthIds}
        onEditRevenue={(revenue) => {
          setShowForm(false);
          setEditingRevenue(revenue);
        }}
      />

      <RevenuesByProjectChart items={byProject} />
    </div>
  );
}
