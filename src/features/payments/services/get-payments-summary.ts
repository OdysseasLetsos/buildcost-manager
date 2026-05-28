import type { EmployeePaymentWithRelations, PaymentsSummary } from "../types";

export function getPaymentsSummary(
  payments: EmployeePaymentWithRelations[],
): PaymentsSummary {
  return {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    employeeCount: new Set(payments.map((payment) => payment.employee_id)).size,
  };
}
