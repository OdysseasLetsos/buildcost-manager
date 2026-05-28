import { allocationMethodLabels, allocationStatusLabels } from "../constants";
import type { ExpenseAllocationMethod, ExpenseAllocationStatus } from "../constants";

export function AllocationMethodBadge({
  method,
}: Readonly<{
  method: ExpenseAllocationMethod;
}>) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
      {allocationMethodLabels[method]}
    </span>
  );
}

export function AllocationStatusBadge({
  status,
}: Readonly<{
  status: ExpenseAllocationStatus;
}>) {
  const className =
    status === "allocated"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-amber-50 text-amber-800";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {allocationStatusLabels[status]}
    </span>
  );
}
