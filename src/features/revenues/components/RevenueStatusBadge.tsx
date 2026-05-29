import { revenueStatusLabels, type RevenueStatus } from "../constants";

const statusClasses: Record<RevenueStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  partial: "bg-blue-50 text-blue-800",
  paid: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export function RevenueStatusBadge({ status }: Readonly<{ status: RevenueStatus }>) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {revenueStatusLabels[status]}
    </span>
  );
}
