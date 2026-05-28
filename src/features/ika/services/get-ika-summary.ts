import type { EmployeeIkaWithRelations, IkaSummary } from "../types";

export function getIkaSummary(ikaRows: EmployeeIkaWithRelations[]): IkaSummary {
  return {
    totalRecords: ikaRows.length,
    totalAmount: ikaRows.reduce((sum, row) => sum + Number(row.ika_amount), 0),
    employeeCount: new Set(ikaRows.map((row) => row.employee_id)).size,
  };
}
