"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import { createMaterial } from "../actions/create-material";
import { updateMaterial } from "../actions/update-material";
import { getMaterialsByProject } from "../services/get-materials-by-project";
import { getMaterialsSummary } from "../services/get-materials-summary";
import type { MaterialWithRelations, Supplier } from "../types";
import { MaterialFilters } from "./MaterialFilters";
import { MaterialForm } from "./MaterialForm";
import { MaterialsByProjectChart } from "./MaterialsByProjectChart";
import { MaterialsSummaryCards } from "./MaterialsSummaryCards";
import { MaterialsTable } from "./MaterialsTable";

function filterMaterials(
  materials: MaterialWithRelations[],
  filters: {
    monthId: string;
    projectId: string;
    supplierName: string;
    paymentStatus: string;
    search: string;
  },
) {
  const supplier = filters.supplierName.trim().toLowerCase();
  const search = filters.search.trim().toLowerCase();
  return materials.filter(
    (material) =>
      (!filters.monthId || material.month_id === filters.monthId) &&
      (!filters.projectId || material.project_id === filters.projectId) &&
      (!filters.paymentStatus || material.payment_status === filters.paymentStatus) &&
      (!supplier || material.supplier_name.toLowerCase().includes(supplier)) &&
      (!search ||
        material.supplier_name.toLowerCase().includes(search) ||
        material.invoice_number.toLowerCase().includes(search) ||
        (material.description ?? "").toLowerCase().includes(search)),
  );
}

export function MaterialsPageClient({
  materials,
  suppliers,
  monthlyPeriods,
  projects,
  canManage,
  canCreateSuppliers,
  featureAvailable,
  defaultMonthId,
}: Readonly<{
  materials: MaterialWithRelations[];
  suppliers: Supplier[];
  monthlyPeriods: MonthlyPeriod[];
  projects: Project[];
  canManage: boolean;
  canCreateSuppliers: boolean;
  featureAvailable: boolean;
  defaultMonthId: string;
}>) {
  const router = useRouter();
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [projectId, setProjectId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithRelations | null>(null);

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
  const filteredMaterials = useMemo(
    () =>
      filterMaterials(materials, {
        monthId: effectiveMonthId,
        projectId,
        supplierName,
        paymentStatus,
        search,
      }),
    [effectiveMonthId, materials, paymentStatus, projectId, search, supplierName],
  );
  const summary = useMemo(() => getMaterialsSummary(filteredMaterials), [filteredMaterials]);
  const byProject = useMemo(
    () => getMaterialsByProject(filteredMaterials),
    [filteredMaterials],
  );
  const activeProjects = projects.filter((project) => project.status !== "archived");
  const canMutate = canManage && featureAvailable && !selectedMonthLocked;

  function handleSuccess() {
    setShowCreateForm(false);
    setEditingMaterial(null);
    router.refresh();
  }

  return (
    <div className="min-w-0 space-y-6 overflow-hidden">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Υλικά</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχείριση τιμολογίων και κόστους υλικών ανά έργο.
          </p>
        </div>
        {canMutate ? (
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Νέο Τιμολόγιο Υλικών
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει Υλικά.
        </section>
      ) : null}

      {selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      {featureAvailable && !canManage ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Έχετε πρόσβαση προβολής. Οι αλλαγές επιτρέπονται μόνο σε owner, admin, office και foreman.
        </section>
      ) : null}

      <MaterialFilters
        monthId={monthId}
        projectId={projectId}
        supplierName={supplierName}
        paymentStatus={paymentStatus}
        search={search}
        monthlyPeriods={monthlyPeriods}
        projects={projects}
        onMonthChange={setMonthId}
        onProjectChange={setProjectId}
        onSupplierChange={setSupplierName}
        onStatusChange={setPaymentStatus}
        onSearchChange={setSearch}
      />

      <MaterialsSummaryCards summary={summary} />

      {(showCreateForm || editingMaterial) && canMutate ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <MaterialForm
            action={editingMaterial ? updateMaterial : createMaterial}
            material={editingMaterial ?? undefined}
            monthlyPeriods={openMonthlyPeriods}
            projects={activeProjects}
            suppliers={suppliers}
            canCreateSuppliers={canCreateSuppliers}
            defaultMonthId={effectiveMonthId}
            submitLabel={editingMaterial ? "Αποθήκευση Αλλαγών" : "Δημιουργία Τιμολογίου"}
            onSuccess={handleSuccess}
          />
        </section>
      ) : null}

      <div className="min-w-0 space-y-6">
        <MaterialsTable
          materials={filteredMaterials}
          canManage={canManage && featureAvailable}
          lockedMonthIds={lockedMonthIds}
          onEditMaterial={(material) => {
            setShowCreateForm(false);
            setEditingMaterial(material);
          }}
        />
        <MaterialsByProjectChart items={byProject} />
      </div>
    </div>
  );
}
