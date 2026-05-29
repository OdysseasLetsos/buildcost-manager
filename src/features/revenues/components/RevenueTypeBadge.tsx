import { revenueTypeLabels, type RevenueType } from "../constants";

export function RevenueTypeBadge({ type }: Readonly<{ type: RevenueType }>) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
      {revenueTypeLabels[type]}
    </span>
  );
}
