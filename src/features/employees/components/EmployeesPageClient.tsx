"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployee } from "../actions/create-employee";
import { updateEmployee } from "../actions/update-employee";
import type {
  Employee,
  EmployeeProjectContract,
  EmployeeProjectOption,
  EmployeeType,
} from "../types";
import { EmployeeFilters } from "./EmployeeFilters";
import { EmployeeForm } from "./EmployeeForm";
import { EmployeesTable } from "./EmployeesTable";

function employeeMatchesSearch(employee: Employee, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [employee.full_name, employee.notes].some((value) =>
    value?.toLowerCase().includes(normalizedSearch),
  );
}

export function EmployeesPageClient({
  employees,
  projectContracts,
  projectOptions,
  canManage,
  featureAvailable,
}: Readonly<{
  employees: Employee[];
  projectContracts: EmployeeProjectContract[];
  projectOptions: EmployeeProjectOption[];
  canManage: boolean;
  featureAvailable: boolean;
}>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [employeeType, setEmployeeType] = useState<EmployeeType | "all">("all");
  const [status, setStatus] = useState<"active" | "inactive" | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const contractsByEmployeeId = useMemo(() => {
    const grouped = new Map<string, EmployeeProjectContract[]>();

    for (const contract of projectContracts) {
      grouped.set(contract.employee_id, [
        ...(grouped.get(contract.employee_id) ?? []),
        contract,
      ]);
    }

    return grouped;
  }, [projectContracts]);

  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employeeMatchesSearch(employee, search) &&
          (employeeType === "all" || employee.employee_type === employeeType) &&
          (status === "all" ||
            (status === "active" ? employee.active : !employee.active)),
      ),
    [employeeType, employees, search, status],
  );

  function handleMutationSuccess() {
    setShowCreateForm(false);
    setEditingEmployee(null);
    router.refresh();
  }

  const canMutateEmployees = canManage && featureAvailable;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Εργαζόμενοι
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Διαχείριση εργαζομένων και συνεργατών της εταιρείας.
          </p>
        </div>

        {canMutateEmployees ? (
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Νέος Εργαζόμενος
          </button>
        ) : null}
      </section>

      {!featureAvailable ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Η λειτουργία εργαζομένων δεν είναι διαθέσιμη στο τρέχον πακέτο.
        </section>
      ) : null}

      {featureAvailable && !canManage ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Έχετε πρόσβαση προβολής στους εργαζόμενους. Οι αλλαγές επιτρέπονται
          μόνο σε ιδιοκτήτες, διαχειριστές και γραφείο.
        </section>
      ) : null}

      {showCreateForm && canMutateEmployees ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Νέος Εργαζόμενος
          </h3>
          <div className="mt-5">
            <EmployeeForm
              action={createEmployee}
              projectOptions={projectOptions}
              submitLabel="Δημιουργία Εργαζομένου"
              onSuccess={handleMutationSuccess}
            />
          </div>
        </section>
      ) : null}

      {editingEmployee && canMutateEmployees ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-950">
              Επεξεργασία Εργαζομένου
            </h3>
            <button
              type="button"
              onClick={() => setEditingEmployee(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Κλείσιμο
            </button>
          </div>
          <div className="mt-5">
            <EmployeeForm
              action={updateEmployee}
              employee={editingEmployee}
              projectOptions={projectOptions}
              projectContracts={contractsByEmployeeId.get(editingEmployee.id) ?? []}
              submitLabel="Αποθήκευση Αλλαγών"
              onSuccess={handleMutationSuccess}
            />
          </div>
        </section>
      ) : null}

      <EmployeeFilters
        search={search}
        employeeType={employeeType}
        status={status}
        onSearchChange={setSearch}
        onEmployeeTypeChange={setEmployeeType}
        onStatusChange={setStatus}
      />

      <EmployeesTable
        employees={filteredEmployees}
        contractsByEmployeeId={contractsByEmployeeId}
        canManage={canMutateEmployees}
        onEditEmployee={setEditingEmployee}
      />
    </div>
  );
}
