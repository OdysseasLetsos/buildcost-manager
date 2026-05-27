"use client";

import type { EmployeeType } from "../types";
import { employeeTypeLabels } from "./EmployeeTypeBadge";

export function EmployeeFilters({
  search,
  employeeType,
  status,
  onSearchChange,
  onEmployeeTypeChange,
  onStatusChange,
}: Readonly<{
  search: string;
  employeeType: EmployeeType | "all";
  status: "active" | "inactive" | "all";
  onSearchChange: (value: string) => void;
  onEmployeeTypeChange: (value: EmployeeType | "all") => void;
  onStatusChange: (value: "active" | "inactive" | "all") => void;
}>) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px]">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Αναζήτηση
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Ονοματεπώνυμο ή σημειώσεις"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Τύπος
        <select
          value={employeeType}
          onChange={(event) =>
            onEmployeeTypeChange(event.target.value as EmployeeType | "all")
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Όλοι</option>
          {Object.entries(employeeTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Κατάσταση
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as "active" | "inactive" | "all")
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Όλες</option>
          <option value="active">Ενεργοί</option>
          <option value="inactive">Ανενεργοί</option>
        </select>
      </label>
    </div>
  );
}
