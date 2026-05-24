import { Button } from "@/components/ui/button";
import type { ToolId } from "@/features/dashboard/tool-config";
import { ReportCard } from "@/features/reports/components/cards/ReportCard";
import type {
  CopyStatus,
  OpenStatus,
  ReportDetails,
} from "@/features/reports/types/reportsTypes";

type ReportsListProps = {
  reports: ReportDetails[];
  compact: boolean;
  copyStatus: CopyStatus;
  openStatus: OpenStatus;
  onCopyPath: (report: ReportDetails) => void;
  onOpenFolder: (report: ReportDetails) => void;
  onToolChange: (tool: ToolId) => void;
  onResetFilters: () => void;
};

export function ReportsList({
  reports,
  compact,
  copyStatus,
  openStatus,
  onCopyPath,
  onOpenFolder,
  onToolChange,
  onResetFilters,
}: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">No matching reports</p>

        <p className="mt-2 text-sm text-muted-foreground">
          Clear the search text or switch the status filter back to All.
        </p>

        <Button className="mt-4" variant="outline" onClick={onResetFilters}>
          Reset filters
        </Button>
      </div>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          compact={compact}
          copyStatus={copyStatus}
          openStatus={openStatus}
          onCopyPath={onCopyPath}
          onOpenFolder={onOpenFolder}
          onToolChange={onToolChange}
        />
      ))}
    </section>
  );
}