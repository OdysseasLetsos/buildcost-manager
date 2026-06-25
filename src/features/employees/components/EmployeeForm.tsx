"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { STANDARD_HOURS_PER_DAY } from "../constants";
import type {
  Employee,
  EmployeeActionState,
  EmployeeProjectContract,
  EmployeeProjectOption,
  EmployeeType,
} from "../types";
import { employeeTypes, initialEmployeeActionState } from "../types";
import { employeeTypeLabels } from "./EmployeeTypeBadge";

type EmployeeFormAction = (
  previousState: EmployeeActionState,
  formData: FormData,
) => Promise<EmployeeActionState>;

type ContractRowState = {
  key: string;
  id?: string;
  projectId: string;
  contractAmount: string;
  notes: string;
};

function formatRateValue(value: number | null): string {
  return value === null ? "" : String(value);
}

function formatMoneyInput(value: number): string {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function roundRate(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "";
}

function makeEmptyContractRow(): ContractRowState {
  return {
    key: crypto.randomUUID(),
    projectId: "",
    contractAmount: "",
    notes: "",
  };
}

function contractsToRows(contracts: EmployeeProjectContract[]): ContractRowState[] {
  if (contracts.length === 0) {
    return [makeEmptyContractRow()];
  }

  return contracts.map((contract) => ({
    key: contract.id,
    id: contract.id,
    projectId: contract.project_id,
    contractAmount: formatMoneyInput(Number(contract.contract_amount)),
    notes: contract.notes ?? "",
  }));
}

export function EmployeeForm({
  action,
  employee,
  projectOptions,
  projectContracts = [],
  submitLabel,
  onSuccess,
}: Readonly<{
  action: EmployeeFormAction;
  employee?: Employee;
  projectOptions: EmployeeProjectOption[];
  projectContracts?: EmployeeProjectContract[];
  submitLabel: string;
  onSuccess?: () => void;
}>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialEmployeeActionState,
  );
  const [employeeType, setEmployeeType] = useState<EmployeeType>(
    employee?.employee_type ?? "permanent",
  );
  const [dailyRate, setDailyRate] = useState(formatRateValue(employee?.daily_rate ?? null));
  const [hourlyRate, setHourlyRate] = useState(formatRateValue(employee?.hourly_rate ?? null));
  const [contractRows, setContractRows] = useState<ContractRowState[]>(
    () => contractsToRows(projectContracts),
  );

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [onSuccess, state.ok]);

  const selectedProjects = useMemo(
    () =>
      new Set(
        contractRows
          .map((contract) => contract.projectId)
          .filter((projectId) => projectId.length > 0),
      ),
    [contractRows],
  );

  const isSubcontractor = employeeType === "subcontractor";

  function handleDailyRateChange(value: string) {
    setDailyRate(value);
    const numericValue = Number(value);
    setHourlyRate(value && Number.isFinite(numericValue) ? roundRate(numericValue / STANDARD_HOURS_PER_DAY) : "");
  }

  function handleHourlyRateChange(value: string) {
    setHourlyRate(value);
    const numericValue = Number(value);
    setDailyRate(value && Number.isFinite(numericValue) ? roundRate(numericValue * STANDARD_HOURS_PER_DAY) : "");
  }

  function updateContractRow(
    key: string,
    patch: Partial<Omit<ContractRowState, "key" | "id">>,
  ) {
    setContractRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeContractRow(key: string) {
    setContractRows((rows) => {
      const nextRows = rows.filter((row) => row.key !== key);
      return nextRows.length > 0 ? nextRows : [makeEmptyContractRow()];
    });
  }

  return (
    <form action={formAction} className="grid gap-4">
      {employee ? <input type="hidden" name="employeeId" value={employee.id} /> : null}

      {state.message ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ονοματεπώνυμο
          <input
            name="fullName"
            defaultValue={employee?.full_name ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          {state.fieldErrors?.fullName ? (
            <span className="text-xs text-red-700">
              {state.fieldErrors.fullName}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Τύπος εργαζομένου
          <select
            name="employeeType"
            value={employeeType}
            onChange={(event) => setEmployeeType(event.target.value as EmployeeType)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            {employeeTypes.map((type) => (
              <option key={type} value={type}>
                {employeeTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        {!isSubcontractor ? (
          <>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Ημερομίσθιο
              <input
                name="dailyRate"
                type="number"
                min="0"
                step="0.01"
                value={dailyRate}
                onChange={(event) => handleDailyRateChange(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
              {state.fieldErrors?.dailyRate ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.dailyRate}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Ωρομίσθιο
              <input
                name="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(event) => handleHourlyRateChange(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
              {state.fieldErrors?.hourlyRate ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.hourlyRate}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Ωρομίσθιο υπερωρίας
              <input
                name="overtimeRate"
                type="number"
                min="0"
                step="0.01"
                defaultValue={formatRateValue(employee?.overtime_rate ?? null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
              {state.fieldErrors?.overtimeRate ? (
                <span className="text-xs text-red-700">
                  {state.fieldErrors.overtimeRate}
                </span>
              ) : null}
              <span className="text-xs font-normal text-slate-500">
                Τυπικές ώρες ημέρας: {STANDARD_HOURS_PER_DAY}
              </span>
            </label>
          </>
        ) : (
          <>
            <input type="hidden" name="dailyRate" value="" />
            <input type="hidden" name="hourlyRate" value="" />
            <input type="hidden" name="overtimeRate" value="" />
          </>
        )}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Κατάσταση
          <select
            name="active"
            defaultValue={employee?.active === false ? "false" : "true"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="true">Ενεργός</option>
            <option value="false">Ανενεργός</option>
          </select>
        </label>
      </div>

      {isSubcontractor ? (
        <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-950">
                Συμβάσεις έργων
              </h4>
              <p className="mt-1 text-xs text-slate-600">
                Κάθε έργο έχει ξεχωριστό ποσό σύμβασης και μετρά ως κόστος συνεργάτη στη Σύνοψη Έργου.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContractRows((rows) => [...rows, makeEmptyContractRow()])}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              + Επιπλέον έργο
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {contractRows.map((contract, index) => (
              <div
                key={contract.key}
                className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-[1.2fr_0.7fr_1fr_auto]"
              >
                <input type="hidden" name="contractId" value={contract.id ?? ""} />
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Έργο
                  <select
                    name="contractProjectId"
                    value={contract.projectId}
                    onChange={(event) =>
                      updateContractRow(contract.key, { projectId: event.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Επιλέξτε έργο</option>
                    {projectOptions.map((project) => {
                      const isSelectedElsewhere =
                        selectedProjects.has(project.id) && project.id !== contract.projectId;

                      return (
                        <option key={project.id} value={project.id} disabled={isSelectedElsewhere}>
                          {project.code} - {project.name}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Ποσό σύμβασης
                  <input
                    name="contractAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={contract.contractAmount}
                    onChange={(event) =>
                      updateContractRow(contract.key, { contractAmount: event.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Σημειώσεις
                  <input
                    name="contractNotes"
                    value={contract.notes}
                    onChange={(event) =>
                      updateContractRow(contract.key, { notes: event.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => removeContractRow(contract.key)}
                  className="self-end rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Αφαίρεση
                </button>

                {index === 0 && state.fieldErrors?.projectContracts ? (
                  <p className="text-xs text-red-700 lg:col-span-4">
                    {state.fieldErrors.projectContracts}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Σημειώσεις
        <textarea
          name="notes"
          defaultValue={employee?.notes ?? ""}
          rows={4}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
      >
        {isPending ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
