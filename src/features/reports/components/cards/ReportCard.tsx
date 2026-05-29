import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportCardActions } from "@/features/reports/components/cards/ReportCardActions";
import { ReportCardAlerts } from "@/features/reports/components/cards/ReportCardAlerts";
import { ReportCardMetrics } from "@/features/reports/components/cards/ReportCardMetrics";
import { CopyStatus, getStatusBadgeVariant, OpenStatus, ReportDetails } from "../../model";
import { ToolId } from "@/features/dashboard";

type ReportCardProps = {
  report: ReportDetails;
  compact: boolean;
  copyStatus: CopyStatus;
  openStatus: OpenStatus;
  onCopyPath: (report: ReportDetails) => void;
  onOpenFolder: (report: ReportDetails) => void;
  onToolChange: (tool: ToolId) => void;
};

export function ReportCard({
  report,
  compact,
  copyStatus,
  openStatus,
  onCopyPath,
  onOpenFolder,
  onToolChange,
}: ReportCardProps) {
  const Icon = report.icon;
  const currentCopyStatus =
    copyStatus?.reportId === report.id ? copyStatus.status : null;
  const currentOpenStatus =
    openStatus?.reportId === report.id ? openStatus : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="size-5" />
              {report.title}
            </CardTitle>
            <CardDescription>{report.fileName}</CardDescription>
          </div>

          <Badge variant={getStatusBadgeVariant(report.status)}>
            {report.statusLabel}
          </Badge>
        </div>

        {!compact ? (
          <CardDescription>{report.description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-4">
        <ReportCardAlerts
          report={report}
          currentCopyStatus={currentCopyStatus}
          currentOpenStatus={currentOpenStatus}
        />

        <ReportCardMetrics report={report} compact={compact} />

        <ReportCardActions
          report={report}
          currentCopyStatus={currentCopyStatus}
          currentOpenStatus={currentOpenStatus}
          onCopyPath={onCopyPath}
          onOpenFolder={onOpenFolder}
          onToolChange={onToolChange}
        />
      </CardContent>
    </Card>
  );
}