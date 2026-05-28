"use client";

import { expenseScopeLabels, type ExpenseScope } from "../constants";

type ExpenseTab = ExpenseScope | "allocation";

export function ExpenseScopeTabs({
  activeTab,
  onTabChange,
}: Readonly<{
  activeTab: ExpenseTab;
  onTabChange: (tab: ExpenseTab) => void;
}>) {
  const tabs: { value: ExpenseTab; label: string }[] = [
    { value: "general", label: expenseScopeLabels.general },
    { value: "office", label: expenseScopeLabels.office },
    { value: "allocation", label: "Κατανομή" },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === tab.value
              ? "bg-blue-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
