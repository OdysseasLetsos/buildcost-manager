import type { EmployeeType } from "../types";

export const employeeTypeLabels: Record<EmployeeType, string> = {
  permanent: "Μόνιμος",
  daily_worker: "Ημερομίσθιος",
  subcontractor: "Συνεργάτης",
};

export function EmployeeTypeBadge({
  employeeType,
}: Readonly<{
  employeeType: EmployeeType;
}>) {
  return (
    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
      {employeeTypeLabels[employeeType]}
    </span>
  );
}
