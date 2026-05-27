import { requireUser } from "@/src/core/auth";
import { getCurrentCompany } from "@/src/core/tenants";
import { getMonthlyPeriodById } from "./get-monthly-period-by-id";

export async function requireOpenMonth(monthId: string) {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    throw new Error("Δεν βρέθηκε ενεργή εταιρεία.");
  }

  const monthlyPeriod = await getMonthlyPeriodById(
    currentCompany.company.id,
    monthId,
  );

  if (!monthlyPeriod) {
    throw new Error("Ο μήνας δεν βρέθηκε.");
  }

  if (monthlyPeriod.status === "locked" || monthlyPeriod.is_locked) {
    throw new Error("Ο μήνας είναι κλειδωμένος και δεν μπορεί να τροποποιηθεί.");
  }

  return monthlyPeriod;
}
