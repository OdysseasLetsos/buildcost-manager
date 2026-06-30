import { getEmployeeById } from "@/src/features/employees/services/get-employee-by-id";
import { getMonthlyPeriodById } from "@/src/features/monthly-periods/services/get-monthly-period-by-id";
import { isFutureMonth } from "@/src/features/monthly-periods/services/month-rules";
import { requireOpenMonth } from "@/src/features/monthly-periods/services/require-open-month";
import { getProjectById } from "@/src/features/projects/services/get-project-by-id";
import { createClient } from "@/src/integrations/supabase/server";
import type { DailyWorkInput } from "../validators";
import {
  DUPLICATE_DAILY_WORK_ERROR,
  FUTURE_WORK_DATE_ERROR,
  FUTURE_WORK_MONTH_ERROR,
  OVERTIME_NOT_ALLOWED_ERROR,
  OVERTIME_THRESHOLD_HOURS,
  getTodayDateKey,
  isFutureDate,
} from "./date-rules";

function isDateInsideMonth(workDate: string, monthKey: string): boolean {
  return workDate.startsWith(`${monthKey}-`);
}

type ExistingDailyWorkRow = {
  id: string;
  project_id: string;
  hours: number;
};

async function validateDuplicateAndOvertime({
  companyId,
  input,
  entryId,
}: {
  companyId: string;
  input: DailyWorkInput;
  entryId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("daily_work_entries")
    .select("id, project_id, hours")
    .eq("company_id", companyId)
    .eq("employee_id", input.employeeId)
    .eq("work_date", input.workDate);

  if (entryId) {
    query = query.neq("id", entryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[daily-work:validateDuplicateAndOvertime] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Δεν ήταν δυνατός ο έλεγχος ημερήσιας εργασίας.");
  }

  const existingRows = (data ?? []) as ExistingDailyWorkRow[];
  const duplicateEntry = existingRows.some(
    (entry) => entry.project_id === input.projectId,
  );

  if (duplicateEntry) {
    throw new Error(DUPLICATE_DAILY_WORK_ERROR);
  }

  const existingRegularHours = existingRows.reduce(
    (sum, entry) => sum + Number(entry.hours),
    0,
  );

  if (
    input.overtimeHours > 0 &&
    existingRegularHours + input.hours < OVERTIME_THRESHOLD_HOURS
  ) {
    throw new Error(OVERTIME_NOT_ALLOWED_ERROR);
  }
}

export async function validateDailyWorkRelations(
  companyId: string,
  input: DailyWorkInput,
  options: { entryId?: string } = {},
) {
  const todayDateKey = getTodayDateKey();

  if (isFutureDate(input.workDate, todayDateKey)) {
    throw new Error(FUTURE_WORK_DATE_ERROR);
  }

  const workMonthKey = input.workDate.slice(0, 7);

  if (isFutureMonth(workMonthKey)) {
    throw new Error(FUTURE_WORK_MONTH_ERROR);
  }

  const monthlyPeriod = await requireOpenMonth(input.monthId);

  if (monthlyPeriod.company_id !== companyId) {
    throw new Error("Ο μήνας δεν ανήκει στην τρέχουσα εταιρεία.");
  }

  const [employee, project, selectedMonth] = await Promise.all([
    getEmployeeById(companyId, input.employeeId),
    getProjectById(companyId, input.projectId),
    getMonthlyPeriodById(companyId, input.monthId),
  ]);

  if (!selectedMonth || selectedMonth.id !== monthlyPeriod.id) {
    throw new Error("Ο μήνας δεν βρέθηκε.");
  }

  if (!employee || !employee.active) {
    throw new Error("Ο εργαζόμενος δεν είναι ενεργός.");
  }

  if (!project || project.status === "archived") {
    throw new Error("Το έργο δεν είναι διαθέσιμο για καταχώρηση.");
  }

  if (!isDateInsideMonth(input.workDate, selectedMonth.month_key)) {
    throw new Error("Η ημερομηνία εργασίας δεν ανήκει στον επιλεγμένο μήνα.");
  }

  await validateDuplicateAndOvertime({
    companyId,
    input,
    entryId: options.entryId,
  });

  return { monthlyPeriod: selectedMonth, employee, project };
}
