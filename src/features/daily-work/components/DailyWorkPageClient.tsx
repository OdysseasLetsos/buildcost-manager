"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee } from "@/src/features/employees/types";
import type { MonthlyPeriod } from "@/src/features/monthly-periods/types";
import type { Project } from "@/src/features/projects/types";
import { createDailyWorkEntry } from "../actions/create-daily-work-entry";
import { updateDailyWorkEntry } from "../actions/update-daily-work-entry";
import { getDailyWorkSummary } from "../services/get-daily-work-summary";
import type { DailyWorkEntryWithRelations } from "../types";
import { DailyWorkFilters } from "./DailyWorkFilters";
import { DailyWorkForm } from "./DailyWorkForm";
import { DailyWorkSummaryCards } from "./DailyWorkSummaryCards";
import { DailyWorkTable } from "./DailyWorkTable";

function filterEntries(
  entries: DailyWorkEntryWithRelations[],
  filters: {
    monthId: string;
    workDate: string;
    employeeId: string;
    projectId: string;
  },
) {
  return entries.filter(
    (entry) =>
      (!filters.monthId || entry.month_id === filters.monthId) &&
      (!filters.workDate || entry.work_date === filters.workDate) &&
      (!filters.employeeId || entry.employee_id === filters.employeeId) &&
      (!filters.projectId || entry.project_id === filters.projectId),
  );
}

function isWritableMonth(period: MonthlyPeriod, currentMonthKey: string): boolean {
  return period.status === "open" && !period.is_locked && period.month_key <= currentMonthKey;
}

export function DailyWorkPageClient({
  entries,
  monthlyPeriods,
  employees,
  projects,
  canManage,
  featureAvailable,
  defaultMonthId,
  todayDate,
  currentMonthKey,
}: Readonly<{
  entries: DailyWorkEntryWithRelations[];
  monthlyPeriods: MonthlyPeriod[];
  employees: Employee[];
  projects: Project[];
  canManage: boolean;
  featureAvailable: boolean;
  defaultMonthId: string;
  todayDate: string;
  currentMonthKey: string;
}>) {
  const router = useRouter();
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [workDate, setWorkDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<DailyWorkEntryWithRelations | null>(null);

  const writableMonthlyPeriods = useMemo(
    () => monthlyPeriods.filter((period) => isWritableMonth(period, currentMonthKey)),
    [currentMonthKey, monthlyPeriods],
  );
  const selectedMonth = monthlyPeriods.find((period) => period.id === monthId);
  const selectedMonthLocked =
    selectedMonth?.status === "locked" || selectedMonth?.is_locked === true;
  const selectedMonthWritable = selectedMonth
    ? isWritableMonth(selectedMonth, currentMonthKey)
    : false;
  const filteredEntries = useMemo(
    () => filterEntries(entries, { monthId, workDate, employeeId, projectId }),
    [employeeId, entries, monthId, projectId, workDate],
  );
  const summary = useMemo(
    () => getDailyWorkSummary(filteredEntries),
    [filteredEntries],
  );

  function handleMutationSuccess() {
    setShowCreateForm(false);
    setEditingEntry(null);
    router.refresh();
  }

  const canMutate = canManage && featureAvailable && selectedMonthWritable;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Ημερήσια Εργασία
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Καταγραφή ημερήσιας εργασίας εργαζομένων ανά έργο και μήνα.
          </p>
        </div>

        {canMutate ? (
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Νέα Καταχώρηση
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Η λειτουργία ημερήσιας εργασίας δεν είναι διαθέσιμη στο τρέχον πακέτο.
        </section>
      ) : null}

      {featureAvailable && canManage && !defaultMonthId ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Δεν υπάρχει ανοιχτός τρέχων μήνας για καταχώρηση ημερήσιας εργασίας.
        </section>
      ) : null}

      {selectedMonthLocked ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
          Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.
        </section>
      ) : null}

      {selectedMonth && selectedMonth.month_key > currentMonthKey ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Δεν μπορείτε να καταχωρήσετε εργασία σε μελλοντικό μήνα.
        </section>
      ) : null}

      {selectedMonth &&
      selectedMonth.month_key < currentMonthKey &&
      selectedMonthWritable ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          Ο προηγούμενος μήνας είναι ξεκλειδωμένος για διορθώσεις.
        </section>
      ) : null}

      {featureAvailable && !canManage ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Έχετε πρόσβαση προβολής. Οι αλλαγές επιτρέπονται μόνο σε ιδιοκτήτες,
          διαχειριστές, γραφείο και εργοδηγούς.
        </section>
      ) : null}

      <DailyWorkFilters
        monthId={monthId}
        workDate={workDate}
        employeeId={employeeId}
        projectId={projectId}
        monthlyPeriods={monthlyPeriods}
        employees={employees}
        projects={projects}
        onMonthChange={setMonthId}
        onWorkDateChange={setWorkDate}
        onEmployeeChange={setEmployeeId}
        onProjectChange={setProjectId}
      />

      <DailyWorkSummaryCards summary={summary} />

      {showCreateForm && canMutate ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Νέα Καταχώρηση
          </h3>
          <div className="mt-5">
            <DailyWorkForm
              action={createDailyWorkEntry}
              monthlyPeriods={writableMonthlyPeriods}
              employees={employees}
              projects={projects}
              defaultMonthId={monthId || defaultMonthId}
              todayDate={todayDate}
              submitLabel="Δημιουργία Καταχώρησης"
              onSuccess={handleMutationSuccess}
            />
          </div>
        </section>
      ) : null}

      {editingEntry && canMutate ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-950">
              Επεξεργασία Καταχώρησης
            </h3>
            <button
              type="button"
              onClick={() => setEditingEntry(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Κλείσιμο
            </button>
          </div>
          <div className="mt-5">
            <DailyWorkForm
              action={updateDailyWorkEntry}
              entry={editingEntry}
              monthlyPeriods={writableMonthlyPeriods}
              employees={employees}
              projects={projects}
              defaultMonthId={monthId || defaultMonthId}
              todayDate={todayDate}
              submitLabel="Αποθήκευση Αλλαγών"
              onSuccess={handleMutationSuccess}
            />
          </div>
        </section>
      ) : null}

      <DailyWorkTable
        entries={filteredEntries}
        canManage={canMutate}
        onEditEntry={setEditingEntry}
      />
    </div>
  );
}
