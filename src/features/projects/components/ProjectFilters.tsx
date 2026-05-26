"use client";

import type { ProjectStatus } from "../types";
import { statusLabels } from "./ProjectStatusBadge";

export function ProjectFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Readonly<{
  search: string;
  status: ProjectStatus | "all";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatus | "all") => void;
}>) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Αναζήτηση
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Κωδικός, έργο, πελάτης ή τοποθεσία"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Κατάσταση
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as ProjectStatus | "all")
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Όλες</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
