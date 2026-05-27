import { redirect } from "next/navigation";
import { requireUser } from "@/src/core/auth";
import { getCurrentCompany } from "@/src/core/tenants";
import { ActiveProjectsSection } from "@/src/features/dashboard/components/ActiveProjectsSection";
import { DashboardSummaryCards } from "@/src/features/dashboard/components/DashboardSummaryCards";
import { EmployeesOverviewSection } from "@/src/features/dashboard/components/EmployeesOverviewSection";
import { MonthlyChartPlaceholder } from "@/src/features/dashboard/components/MonthlyChartPlaceholder";
import { MonthlyPeriodsOverviewSection } from "@/src/features/dashboard/components/MonthlyPeriodsOverviewSection";
import { NotificationsPlaceholder } from "@/src/features/dashboard/components/NotificationsPlaceholder";
import { RecentActivityPlaceholder } from "@/src/features/dashboard/components/RecentActivityPlaceholder";
import { getDashboardEmployees } from "@/src/features/dashboard/services/get-dashboard-employees";
import { getDashboardMonthlyPeriods } from "@/src/features/dashboard/services/get-dashboard-monthly-periods";
import { getDashboardProjects } from "@/src/features/dashboard/services/get-dashboard-projects";

export default async function DashboardPage() {
  await requireUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    redirect("/onboarding/company");
  }

  const companyId = currentCompany.company.id;
  const [projectStats, employeeStats, monthlyPeriodStats] = await Promise.all([
    getDashboardProjects(companyId),
    getDashboardEmployees(companyId),
    getDashboardMonthlyPeriods(companyId),
  ]);

  // TODO: Wire financial cards to revenues, expenses, payments, materials,
  // daily work and IKA modules when those business modules are implemented.
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
              Γρήγορη εικόνα για ενεργά έργα, οικονομικούς δείκτες και
              εκκρεμότητες. Τα οικονομικά στοιχεία θα συνδεθούν με τα αντίστοιχα
              modules όταν υλοποιηθούν.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span className="font-semibold">{currentCompany.company.name}</span>
          </div>
        </div>
      </section>

      <DashboardSummaryCards
        projectStats={projectStats}
        employeeStats={employeeStats}
        monthlyPeriodStats={monthlyPeriodStats}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <ActiveProjectsSection projects={projectStats.latestActiveProjects} />

        <div className="space-y-6">
          <NotificationsPlaceholder />
          <RecentActivityPlaceholder />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeesOverviewSection employeeStats={employeeStats} />
        <MonthlyPeriodsOverviewSection monthlyPeriodStats={monthlyPeriodStats} />
      </div>

      <MonthlyChartPlaceholder />
    </div>
  );
}
