import type { MonthlyPeriodStatus } from "../types";

const statusLabels: Record<MonthlyPeriodStatus, string> = {
  open: "Ανοιχτός",
  locked: "Κλειδωμένος",
};

export function MonthlyPeriodStatusBadge({
  status,
}: Readonly<{
  status: MonthlyPeriodStatus;
}>) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        status === "open"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-blue-200 bg-blue-50 text-blue-800"
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}
