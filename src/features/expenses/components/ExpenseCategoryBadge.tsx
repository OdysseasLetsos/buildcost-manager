import { expenseCategoryLabels } from "../constants";

export function ExpenseCategoryBadge({ category }: Readonly<{ category: string }>) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {expenseCategoryLabels[category] ?? category}
    </span>
  );
}
