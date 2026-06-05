"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "el" | "en";

const storageKey = "buildcost-language";
const legacyStorageKey = "buildcost-manager-language";

const translations = {
  el: {
    "app.workspace": "Πίνακας εργασίας",
    "app.user": "Χρήστης",
    "app.logout": "Αποσύνδεση",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Έργα",
    "nav.employees": "Εργαζόμενοι",
    "nav.months": "Μήνες",
    "nav.dailyWork": "Ημερήσια Εργασία",
    "nav.payments": "Πληρωμές & ΙΚΑ",
    "nav.materials": "Υλικά",
    "nav.expenses": "Έξοδα",
    "nav.revenues": "Έσοδα",
    "nav.projectSummary": "Σύνοψη Έργου",
    "nav.aiInvoices": "AI Τιμολόγια",
    "nav.reports": "Αναφορές",
    "nav.settings": "Ρυθμίσεις",
    "settings.title": "Ρυθμίσεις Γλώσσας",
    "settings.description":
      "Επιλέξτε τη γλώσσα για τα κοινά στοιχεία της εφαρμογής. Τα Ελληνικά παραμένουν η προεπιλογή.",
    "settings.language": "Γλώσσα εφαρμογής",
    "settings.languageGreek": "Ελληνικά",
    "settings.languageEnglish": "English",
    "settings.translationTodo":
      "TODO: Η πλήρης μετάφραση όλων των επιμέρους ενοτήτων θα επεκταθεί σταδιακά.",
    "settings.membersTitle": "Μέλη εταιρείας",
    "settings.membersDescription":
      "Διαχειριστείτε προσκλήσεις, ρόλους και πρόσβαση μελών.",
    "settings.manageMembers": "Διαχείριση μελών",
    "dashboard.totalRevenue": "Σύνολο Εσόδων",
    "dashboard.totalCost": "Συνολικό Κόστος",
    "dashboard.monthProfit": "Κέρδος Μήνα",
    "dashboard.activeProjects": "Ενεργά Έργα",
    "dashboard.totalHours": "Σύνολο Ωρών",
    "dashboard.overtime": "Υπερωρίες",
    "dashboard.employeeExpenses": "Έξοδα Εργαζομένων",
    "projectSummary.title": "Σύνοψη Έργου",
    "projectSummary.subtitle":
      "Συγκεντρωτική εικόνα κόστους, εσόδων και κερδοφορίας ανά έργο.",
    "projectSummary.month": "Μήνας",
    "projectSummary.selectMonth": "Επιλέξτε μήνα",
    "projectSummary.project": "Έργο",
    "projectSummary.allProjects": "Όλα τα έργα",
    "projectSummary.allMonths": "Όλοι οι μήνες",
    "projectSummary.revenue": "Έσοδα",
    "projectSummary.totalCost": "Συνολικό Κόστος",
    "projectSummary.profitLoss": "Κέρδος / Ζημιά",
    "projectSummary.margin": "Περιθώριο",
    "projectSummary.costBreakdown": "Ανάλυση Κόστους",
    "projectSummary.costDistribution": "Κατανομή Κόστους",
    "projectSummary.payments": "Πληρωμές",
    "projectSummary.ika": "ΙΚΑ",
    "projectSummary.materials": "Υλικά",
    "projectSummary.expenses": "Έξοδα",
    "projectSummary.employeeExpenses": "Έξοδα Εργαζομένων",
    "projectSummary.allocatedExpenses": "Γενικά / Έδρα Έξοδα",
    "projectSummary.hours": "Ώρες",
    "projectSummary.overtime": "Υπερωρίες",
    "projectSummary.received": "Εισπραχθέντα",
    "projectSummary.remaining": "Υπόλοιπο",
    "projectSummary.profit": "Κέρδος",
    "projectSummary.status": "Κατάσταση",
    "projectSummary.healthy": "Υγιές",
    "projectSummary.lowMargin": "Χαμηλό Περιθώριο",
    "projectSummary.loss": "Ζημιά",
    "projectSummary.noRevenue": "Χωρίς Έσοδα",
    "projectSummary.noData": "Δεν υπάρχουν δεδομένα σύνοψης για την επιλογή σας.",
    "projectSummary.alerts": "Ειδοποιήσεις",
    "projectSummary.lossMessage": "Το έργο εμφανίζει ζημιά.",
    "projectSummary.lowMarginMessage": "Το έργο έχει περιθώριο κάτω από 10%.",
    "projectSummary.noRevenueMessage":
      "Το έργο έχει κόστος αλλά δεν έχει έσοδα.",
    "reports.title": "Αναφορές",
  },
  en: {
    "app.workspace": "Workspace",
    "app.user": "User",
    "app.logout": "Log out",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.employees": "Employees",
    "nav.months": "Months",
    "nav.dailyWork": "Daily Work",
    "nav.payments": "Payments & IKA",
    "nav.materials": "Materials",
    "nav.expenses": "Expenses",
    "nav.revenues": "Revenues",
    "nav.projectSummary": "Project Summary",
    "nav.aiInvoices": "AI Invoices",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "settings.title": "Language Settings",
    "settings.description":
      "Choose the language for shared app interface elements. Greek remains the default.",
    "settings.language": "App language",
    "settings.languageGreek": "Greek",
    "settings.languageEnglish": "English",
    "settings.translationTodo":
      "TODO: Full translation for all module-specific screens will be expanded gradually.",
    "settings.membersTitle": "Company members",
    "settings.membersDescription":
      "Manage invitations, roles and member access.",
    "settings.manageMembers": "Manage members",
    "dashboard.totalRevenue": "Total Revenue",
    "dashboard.totalCost": "Total Cost",
    "dashboard.monthProfit": "Monthly Profit",
    "dashboard.activeProjects": "Active Projects",
    "dashboard.totalHours": "Total Hours",
    "dashboard.overtime": "Overtime",
    "dashboard.employeeExpenses": "Employee Expenses",
    "projectSummary.title": "Project Summary",
    "projectSummary.subtitle":
      "A consolidated view of cost, revenue and profitability by project.",
    "projectSummary.month": "Month",
    "projectSummary.selectMonth": "Select month",
    "projectSummary.project": "Project",
    "projectSummary.allProjects": "All projects",
    "projectSummary.allMonths": "All months",
    "projectSummary.revenue": "Revenue",
    "projectSummary.totalCost": "Total Cost",
    "projectSummary.profitLoss": "Profit / Loss",
    "projectSummary.margin": "Margin",
    "projectSummary.costBreakdown": "Cost Breakdown",
    "projectSummary.costDistribution": "Cost Distribution",
    "projectSummary.payments": "Payments",
    "projectSummary.ika": "IKA",
    "projectSummary.materials": "Materials",
    "projectSummary.expenses": "Expenses",
    "projectSummary.employeeExpenses": "Employee Expenses",
    "projectSummary.allocatedExpenses": "General / Office Expenses",
    "projectSummary.hours": "Hours",
    "projectSummary.overtime": "Overtime",
    "projectSummary.received": "Received",
    "projectSummary.remaining": "Remaining",
    "projectSummary.profit": "Profit",
    "projectSummary.status": "Status",
    "projectSummary.healthy": "Healthy",
    "projectSummary.lowMargin": "Low Margin",
    "projectSummary.loss": "Loss",
    "projectSummary.noRevenue": "No Revenue",
    "projectSummary.noData": "No summary data exists for your selection.",
    "projectSummary.alerts": "Alerts",
    "projectSummary.lossMessage": "The project is showing a loss.",
    "projectSummary.lowMarginMessage": "The project margin is below 10%.",
    "projectSummary.noRevenueMessage":
      "The project has cost but no revenue.",
    "reports.title": "Reports",
  },
} as const;

export type TranslationKey = keyof typeof translations.el;

const extraTextTranslations = [
  ["Νέο Έργο", "New Project"],
  ["Νέος Εργαζόμενος", "New Employee"],
  ["Νέος Μήνας", "New Month"],
  ["Νέα Καταχώρηση", "New Entry"],
  ["Νέα Πληρωμή", "New Payment"],
  ["Νέο ΙΚΑ", "New IKA"],
  ["Νέο Τιμολόγιο Υλικών", "New Material Invoice"],
  ["Νέο Έξοδο", "New Expense"],
  ["Νέο Έσοδο", "New Revenue"],
  ["Αναζήτηση", "Search"],
  ["Φίλτρα", "Filters"],
  ["Ενέργειες", "Actions"],
  ["Λεπτομέρειες", "Details"],
  ["Προβολή", "View"],
  ["Επεξεργασία", "Edit"],
  ["Διαγραφή", "Delete"],
  ["Αποθήκευση", "Save"],
  ["Ακύρωση", "Cancel"],
  ["Δημιουργία", "Create"],
  ["Αλλαγή", "Change"],
  ["Αποστολή πρόσκλησης", "Send invitation"],
  ["Κωδικός", "Code"],
  ["Όνομα Έργου", "Project Name"],
  ["Πελάτης", "Client"],
  ["Τοποθεσία", "Location"],
  ["Προϋπολογισμός", "Budget"],
  ["Έναρξη", "Start"],
  ["Λήξη", "End"],
  ["Κατάσταση", "Status"],
  ["Ονοματεπώνυμο", "Full Name"],
  ["Τύπος", "Type"],
  ["Ημερομίσθιο", "Daily Rate"],
  ["Ωρομίσθιο", "Hourly Rate"],
  ["Σημειώσεις", "Notes"],
  ["Ημερομηνία", "Date"],
  ["Εργαζόμενος", "Employee"],
  ["Ώρες", "Hours"],
  ["Υπερωρίες", "Overtime"],
  ["Περιγραφή", "Description"],
  ["Έξοδα", "Expenses"],
  ["Ποσό", "Amount"],
  ["Τρόπος Πληρωμής", "Payment Method"],
  ["Μετρητά", "Cash"],
  ["Τράπεζα", "Bank"],
  ["Άλλο", "Other"],
  ["Προμηθευτής", "Supplier"],
  ["ΑΦΜ Προμηθευτή", "Supplier VAT"],
  ["Αριθμός Τιμολογίου", "Invoice Number"],
  ["Καθαρή Αξία", "Net Amount"],
  ["ΦΠΑ", "VAT"],
  ["Σύνολο", "Total"],
  ["Εκκρεμεί", "Pending"],
  ["Πληρωμένο", "Paid"],
  ["Γενικά Έξοδα", "General Expenses"],
  ["Έξοδα Έδρας", "Office Expenses"],
  ["Κατανομή", "Allocation"],
  ["Κατηγορία", "Category"],
  ["Μέθοδος Κατανομής", "Allocation Method"],
  ["Τιμολογηθέντα", "Invoiced"],
  ["Εισπραχθέντα", "Received"],
  ["Υπόλοιπο", "Remaining"],
  ["Τύπος Εσόδου", "Revenue Type"],
  ["Τιμολόγιο", "Invoice"],
  ["Προκαταβολή", "Advance"],
  ["Εξόφληση", "Payment"],
  ["Πιστωτικό", "Credit"],
  ["Μερικώς", "Partial"],
  ["Εξοφλημένο", "Paid"],
  ["Ακυρωμένο", "Cancelled"],
  ["Ανοιχτός", "Open"],
  ["Κλειδωμένος", "Locked"],
  ["Κλείδωμα", "Lock"],
  ["Άνοιγμα", "Reopen"],
  ["Καταχωρήσεις", "Entries"],
  ["Έλεγχος", "Review"],
  ["Αναφορές", "Reports"],
  ["Εξαγωγή Excel", "Export Excel"],
  ["Εξαγωγή PDF", "Export PDF"],
  ["Δεν έχετε δικαίωμα πρόσβασης στις αναφορές.", "You do not have permission to access reports."],
  ["Δεν έχετε δικαίωμα πρόσβασης στη σύνοψη έργου.", "You do not have permission to access project summary."],
  ["Δεν έχετε δικαίωμα πρόσβασης στα έξοδα.", "You do not have permission to access expenses."],
  ["Δεν έχετε δικαίωμα πρόσβασης στα έσοδα.", "You do not have permission to access revenues."],
  ["Ο μήνας είναι κλειδωμένος και δεν επιτρέπονται αλλαγές.", "The month is locked and changes are not allowed."],
  ["Δεν υπάρχουν δεδομένα.", "No data."],
  ["Δεν υπάρχουν καταχωρήσεις.", "No entries."],
] as const;

const textTranslations = [
  ...Object.keys(translations.el).map((key) => [
    translations.el[key as TranslationKey],
    translations.en[key as TranslationKey],
  ] as const),
  ...extraTextTranslations,
];

const elToEnText = new Map<string, string>(textTranslations);
const enToElText = new Map<string, string>(
  textTranslations.map(([el, en]) => [en, el]),
);

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "el";

  const storedLanguage =
    window.localStorage.getItem(storageKey) ??
    window.localStorage.getItem(legacyStorageKey);
  return storedLanguage === "en" ? "en" : "el";
}

function translateTextValue(value: string, language: AppLanguage): string {
  const trimmedValue = value.trim();
  const translatedValue =
    language === "en" ? elToEnText.get(trimmedValue) : enToElText.get(trimmedValue);

  if (!translatedValue) return value;

  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? "";
  return `${leadingWhitespace}${translatedValue}${trailingWhitespace}`;
}

function translateOptionElements(root: ParentNode, language: AppLanguage) {
  root.querySelectorAll("option").forEach((option) => {
    option.textContent = translateTextValue(option.textContent ?? "", language);
  });
}

function translateTextNodes(root: ParentNode, language: AppLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    const parentElement = currentNode.parentElement;

    if (
      parentElement &&
      !["SCRIPT", "STYLE", "TEXTAREA"].includes(parentElement.tagName)
    ) {
      currentNode.textContent = translateTextValue(
        currentNode.textContent ?? "",
        language,
      );
    }

    currentNode = walker.nextNode();
  }
}

function translateDocument(language: AppLanguage) {
  translateTextNodes(document.body, language);
  translateOptionElements(document.body, language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("el");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLanguageState(getInitialLanguage());
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    function setLanguage(nextLanguage: AppLanguage) {
      setLanguageState(nextLanguage);
      window.localStorage.setItem(storageKey, nextLanguage);
      window.localStorage.removeItem(legacyStorageKey);
      document.documentElement.lang = nextLanguage;
    }

    return {
      language,
      setLanguage,
      t: (key) => translations[language][key] ?? translations.el[key],
    };
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    translateDocument(language);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = translateTextValue(node.textContent ?? "", language);
            return;
          }

          if (node instanceof HTMLElement) {
            translateTextNodes(node, language);
            translateOptionElements(node, language);
          }
        });

        if (mutation.type === "characterData") {
          mutation.target.textContent = translateTextValue(
            mutation.target.textContent ?? "",
            language,
          );
        }
      }
    });

    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used inside LanguageProvider.");
  }

  return context;
}

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {t("settings.language")}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      >
        <option value="el">{t("settings.languageGreek")}</option>
        <option value="en">{t("settings.languageEnglish")}</option>
      </select>
    </label>
  );
}

export function LanguageSettingsSection() {
  const { t } = useTranslation();

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-700">BuildCost Manager</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {t("settings.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t("settings.description")}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-sm">
          <LanguageSelector />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {t("settings.translationTodo")}
        </p>
      </section>
    </>
  );
}
