import type { ReportType } from "../constants";
import { reportDescriptions, reportTypeLabels } from "../constants";
import { ExportButtons } from "./ExportButtons";

export function ReportCard({
  reportType,
  selected,
  monthId,
  projectId,
  employeeId,
  excelAvailable,
  pdfAvailable,
  onSelect,
}: {
  reportType: ReportType;
  selected: boolean;
  monthId: string;
  projectId?: string;
  employeeId?: string;
  excelAvailable: boolean;
  pdfAvailable: boolean;
  onSelect: (reportType: ReportType) => void;
}) {
  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-950">
          {reportTypeLabels[reportType]}
        </h3>
        <p className="min-h-10 text-sm text-slate-600">{reportDescriptions[reportType]}</p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <button
          className="rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
          onClick={() => onSelect(reportType)}
          type="button"
        >
          Προβολή
        </button>
        {selected ? (
          <ExportButtons
            employeeId={employeeId}
            excelAvailable={excelAvailable}
            monthId={monthId}
            pdfAvailable={pdfAvailable}
            projectId={projectId}
            reportType={reportType}
          />
        ) : null}
      </div>
    </article>
  );
}
