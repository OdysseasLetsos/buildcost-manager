"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavigationIconName =
  | "dashboard"
  | "projects"
  | "employees"
  | "months"
  | "dailyWork"
  | "payments"
  | "materials"
  | "expenses"
  | "revenues"
  | "summary"
  | "aiInvoices"
  | "reports"
  | "settings";

export type NavigationItem = {
  href: string;
  label: string;
  icon: NavigationIconName;
};

const iconPaths: Record<NavigationIconName, string[]> = {
  dashboard: [
    "M4 13h7V4H4v9Z",
    "M13 20h7V4h-7v16Z",
    "M4 20h7v-5H4v5Z",
  ],
  projects: [
    "M4 7h16",
    "M4 7v12h16V7",
    "M8 7V5h8v2",
    "M8 12h8",
    "M8 16h5",
  ],
  employees: [
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    "M3.5 19a5.5 5.5 0 0 1 11 0",
    "M16 11a2.5 2.5 0 1 0 0-5",
    "M17 14a4.5 4.5 0 0 1 3.5 4.4",
  ],
  months: [
    "M6 4v3",
    "M18 4v3",
    "M4 8h16",
    "M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
    "M8 12h3",
    "M13 12h3",
    "M8 16h3",
  ],
  dailyWork: [
    "M12 6v6l4 2",
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  ],
  payments: [
    "M4 7h16v10H4V7Z",
    "M4 10h16",
    "M7 15h4",
    "M15 15h2",
  ],
  materials: [
    "M4 8 12 4l8 4-8 4-8-4Z",
    "M4 12l8 4 8-4",
    "M4 16l8 4 8-4",
  ],
  expenses: [
    "M6 3h9l3 3v15H6V3Z",
    "M14 3v4h4",
    "M9 12h6",
    "M9 16h6",
  ],
  revenues: [
    "M4 17 9 12l4 4 7-9",
    "M4 21h16",
  ],
  summary: [
    "M4 19V5",
    "M4 19h16",
    "M8 15v-4",
    "M12 15V8",
    "M16 15v-6",
  ],
  aiInvoices: [
    "M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z",
    "M5 17h14",
    "M7 21h10",
  ],
  reports: [
    "M5 4h14v16H5V4Z",
    "M9 8h6",
    "M9 12h6",
    "M9 16h3",
  ],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.3 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.3 2.7h4.4l.3-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  ],
};

function NavigationIcon({ name }: { name: NavigationIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}

export function AppShell({
  children,
  userEmail,
  companyName,
  navigationItems,
  logoutAction,
}: Readonly<{
  children: React.ReactNode;
  userEmail?: string;
  companyName?: string;
  navigationItems: NavigationItem[];
  logoutAction: () => Promise<void>;
}>) {
  const pathname = usePathname();

  function isActiveNavigationItem(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-gradient-to-b from-blue-950 via-slate-950 to-slate-900 px-4 py-5 text-white shadow-2xl shadow-slate-950/20 lg:flex">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-sm shadow-slate-950/20 transition hover:bg-white/15"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black tracking-tight text-blue-950 shadow-sm">
            BC
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-wide">
              BuildCost Manager
            </span>
            <span className="mt-0.5 block text-xs font-medium text-blue-100">
              Διαχείριση Κόστους
            </span>
          </span>
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Πλοήγηση
          </p>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1.5" aria-label="Κύρια πλοήγηση">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActiveNavigationItem(item.href) ? "page" : undefined}
              className={`group flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActiveNavigationItem(item.href)
                  ? "bg-white text-blue-950 shadow-lg shadow-slate-950/20"
                  : "text-blue-50/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <NavigationIcon name={item.icon} />
                <span className="truncate">{item.label}</span>
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  isActiveNavigationItem(item.href)
                    ? "bg-blue-700"
                    : "bg-transparent group-hover:bg-blue-200"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-xs font-semibold text-blue-100">
            {companyName ?? "BuildCost Manager"}
          </p>
          <p className="mt-1 truncate text-xs text-blue-100/70">
            {userEmail ?? "Χρήστης"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur md:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Πίνακας εργασίας
                </p>
                <h1 className="mt-1 text-lg font-semibold text-slate-950">
                  {companyName ?? "BuildCost Manager"}
                </h1>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden max-w-64 truncate rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm md:inline">
                  {userEmail ?? "Χρήστης"}
                </span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Αποσύνδεση
                  </button>
                </form>
              </div>
            </div>

            <nav
              className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
              aria-label="Κύρια πλοήγηση"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActiveNavigationItem(item.href) ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActiveNavigationItem(item.href)
                      ? "bg-blue-950 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <NavigationIcon name={item.icon} />
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
