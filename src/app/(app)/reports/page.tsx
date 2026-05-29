import { redirect } from "next/navigation";
import { requireUser } from "@/src/core/auth";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { getEmployees } from "@/src/features/employees/services/get-employees";
import { getMonthlyPeriods } from "@/src/features/monthly-periods/services/get-monthly-periods";
import { getProjects } from "@/src/features/projects/services/get-projects";
import { ReportsPageClient } from "@/src/features/reports/components/ReportsPageClient";
import { getEmployeeWorkReport } from "@/src/features/reports/services/get-employee-work-report";
import { getExpensesReport } from "@/src/features/reports/services/get-expenses-report";
import { getMaterialsReport } from "@/src/features/reports/services/get-materials-report";
import { getMonthlyProjectSummaryReport } from "@/src/features/reports/services/get-monthly-project-summary-report";
import { getRevenuesReport } from "@/src/features/reports/services/get-revenues-report";

export default async function ReportsPage() {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);

  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
  } catch {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Δεν έχετε δικαίωμα πρόσβασης στις αναφορές.
        </h1>
      </section>
    );
  }

  const reportsAvailable = await canUseFeature(companyId, "project_summary");

  if (!reportsAvailable) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-amber-950">
          Το τρέχον πακέτο της εταιρείας δεν περιλαμβάνει αναφορές έργων.
        </h1>
      </section>
    );
  }

  const [monthlyPeriods, projects, employees, excelAvailable, pdfAvailable] =
    await Promise.all([
      getMonthlyPeriods(companyId),
      getProjects(companyId),
      getEmployees(companyId),
      canUseFeature(companyId, "reports_excel"),
      canUseFeature(companyId, "reports_pdf"),
    ]);
  const latestOpenMonth = monthlyPeriods.find(
    (period) => period.status === "open" && !period.is_locked,
  );
  const defaultMonthId = latestOpenMonth?.id ?? monthlyPeriods[0]?.id ?? "";
  const reportEntries = await Promise.all(
    monthlyPeriods.map(async (period) => {
      const [
        monthlyProjectSummary,
        employeeWork,
        materials,
        expenses,
        revenues,
      ] = await Promise.all([
        getMonthlyProjectSummaryReport({
          companyId,
          monthId: period.id,
        }),
        getEmployeeWorkReport({ companyId, monthId: period.id }),
        getMaterialsReport({ companyId, monthId: period.id }),
        getExpensesReport({ companyId, monthId: period.id }),
        getRevenuesReport({ companyId, monthId: period.id }),
      ]);

      return [
        period.id,
        {
          monthlyProjectSummary,
          employeeWork,
          materials,
          expenses,
          revenues,
        },
      ] as const;
    }),
  );

  return (
    <ReportsPageClient
      defaultMonthId={defaultMonthId}
      employees={employees}
      excelAvailable={excelAvailable}
      monthlyPeriods={monthlyPeriods}
      pdfAvailable={pdfAvailable}
      projects={projects}
      reportsByMonth={Object.fromEntries(reportEntries)}
    />
  );
}
