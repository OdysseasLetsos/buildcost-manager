import { redirect } from "next/navigation";
import { requireUser } from "@/src/core/auth";
import { canUseFeature } from "@/src/core/entitlements";
import { requireRole } from "@/src/core/roles";
import { getCurrentCompany, requireCompanyMember } from "@/src/core/tenants";
import { ActiveProjectsSection } from "@/src/features/dashboard/components/ActiveProjectsSection";
import { DashboardAlerts } from "@/src/features/dashboard/components/DashboardAlerts";
import { DashboardFinancialMiniStats } from "@/src/features/dashboard/components/DashboardFinancialMiniStats";
import { DashboardSummaryCards } from "@/src/features/dashboard/components/DashboardSummaryCards";
import { EmployeesOverviewSection } from "@/src/features/dashboard/components/EmployeesOverviewSection";
import { MonthlyFinancialOverview } from "@/src/features/dashboard/components/MonthlyFinancialOverview";
import { MonthlyPeriodsOverviewSection } from "@/src/features/dashboard/components/MonthlyPeriodsOverviewSection";
import { RecentActivityList } from "@/src/features/dashboard/components/RecentActivityList";
import { getDashboardAlerts } from "@/src/features/dashboard/services/get-dashboard-alerts";
import {
  getDashboardFinancials,
  getDashboardMonthlyFinancials,
} from "@/src/features/dashboard/services/get-dashboard-financials";
import { getDashboardDailyWork } from "@/src/features/dashboard/services/get-dashboard-daily-work";
import { getDashboardEmployees } from "@/src/features/dashboard/services/get-dashboard-employees";
import { getDashboardMonthlyPeriods } from "@/src/features/dashboard/services/get-dashboard-monthly-periods";
import { getDashboardProjects } from "@/src/features/dashboard/services/get-dashboard-projects";
import { getDashboardRecentActivity } from "@/src/features/dashboard/services/get-dashboard-recent-activity";

export default async function DashboardPage() {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  await requireCompanyMember(companyId);

  const [projectStats, employeeStats, monthlyPeriodStats] = await Promise.all([
    getDashboardProjects(companyId),
    getDashboardEmployees(companyId),
    getDashboardMonthlyPeriods(companyId),
  ]);
  const selectedMonth = monthlyPeriodStats.selectedMonth;
  const dailyWorkStats = await getDashboardDailyWork(companyId, selectedMonth);

  let canViewFinancials = false;
  try {
    await requireRole(companyId, ["owner", "admin", "office"]);
    canViewFinancials = await canUseFeature(companyId, "project_summary");
  } catch {
    canViewFinancials = false;
  }

  const [financials, monthlyFinancials, recentActivity, alerts] = canViewFinancials
    ? await Promise.all([
        getDashboardFinancials(companyId, selectedMonth),
        getDashboardMonthlyFinancials(companyId, monthlyPeriodStats.latestMonthlyPeriods),
        getDashboardRecentActivity(companyId, selectedMonth?.id ?? null, true),
        getDashboardAlerts(companyId, selectedMonth),
      ])
    : await Promise.all([
        Promise.resolve(null),
        Promise.resolve([]),
        getDashboardRecentActivity(companyId, selectedMonth?.id ?? null, false),
        Promise.resolve([]),
      ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold text-blue-700">Dashboard</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">
              Κεντρική εικόνα εταιρείας
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Πραγματική εικόνα έργων, κόστους, εσόδων και πρόσφατων κινήσεων για τον επιλεγμένο μήνα.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span className="font-semibold">{currentCompany.company.name}</span>
            <span className="ml-2 text-blue-700">
              {selectedMonth?.month_key ?? "Χωρίς μήνα"}
            </span>
          </div>
        </div>
      </section>

      {!canViewFinancials ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Βλέπετε περιορισμένη επιχειρησιακή εικόνα. Τα οικονομικά στοιχεία εμφανίζονται μόνο σε owner, admin και office με ενεργή Σύνοψη Έργου.
        </section>
      ) : null}

      <DashboardSummaryCards
        projectStats={projectStats}
        dailyWorkStats={dailyWorkStats}
        financials={financials}
        canViewFinancials={canViewFinancials}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <ActiveProjectsSection
          projects={projectStats.latestActiveProjects}
          projectTotals={dailyWorkStats.projectTotals}
          financialProjects={financials?.projects ?? []}
          canViewFinancials={canViewFinancials}
        />

        <div className="space-y-6">
          {canViewFinancials ? <DashboardAlerts alerts={alerts} /> : null}
          <RecentActivityList activities={recentActivity} />
        </div>
      </div>

      {canViewFinancials ? (
        <>
          <MonthlyFinancialOverview monthlyTotals={monthlyFinancials} />
          <DashboardFinancialMiniStats financials={financials} />
        </>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <EmployeesOverviewSection employeeStats={employeeStats} />
          <MonthlyPeriodsOverviewSection monthlyPeriodStats={monthlyPeriodStats} />
        </div>
      )}
    </div>
  );
}
