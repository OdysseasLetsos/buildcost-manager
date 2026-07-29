import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import type { ExpenseInput } from "../validators";
import { getCompanyOfficeById } from "./get-company-offices";
import { getCompanyVehicleById } from "./get-company-vehicles";
import { validateExpenseCategory } from "./validate-expense-category";

function isDateInsideMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(`${monthKey}-`);
}

export async function validateExpenseRelations(
  companyId: string,
  input: Pick<
    ExpenseInput,
    | "monthId"
    | "expenseDate"
    | "scope"
    | "category"
    | "allocationMethod"
    | "officeId"
    | "vehicleId"
  >,
) {
  validateExpenseCategory(input.scope, input.category);

  const monthlyPeriod = await requireOpenMonth(input.monthId);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  if (!isDateInsideMonth(input.expenseDate, monthlyPeriod.month_key)) {
    throw new Error("Η ημερομηνία εξόδου δεν ανήκει στον επιλεγμένο μήνα.");
  }

  if (input.category === "office") {
    if (!input.officeId) {
      throw new Error("Επιλέξτε γραφείο.");
    }

    const office = await getCompanyOfficeById(companyId, input.officeId);

    if (!office || !office.active) {
      throw new Error("Το γραφείο δεν είναι διαθέσιμο.");
    }
  }

  if (input.category === "transport") {
    if (!input.vehicleId) {
      throw new Error("Επιλέξτε όχημα.");
    }

    const vehicle = await getCompanyVehicleById(companyId, input.vehicleId);

    if (!vehicle || !vehicle.active) {
      throw new Error("Το όχημα δεν είναι διαθέσιμο.");
    }
  }

  if (input.allocationMethod === "manual") {
    return {
      monthlyPeriod,
      warning: "Η χειροκίνητη κατανομή θα υποστηριχθεί σε επόμενη έκδοση.",
    };
  }

  return { monthlyPeriod, warning: null };
}
