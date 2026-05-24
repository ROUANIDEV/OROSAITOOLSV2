import { AlertCircle, Check, Copy, FolderOpen } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ToolId } from "@/features/dashboard/tool-config";
import type {
  CopyStatus,
  OpenStatus,
  ReportDetails,
} from "@/features/reports/reportsTypes";
import {
  formatDateTime,
  getStatusBadgeVariant,
} from "@/features/reports/reportsUtils";

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
        {report.error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Last error</AlertTitle>
            <AlertDescription>{report.error}</AlertDescription>
          </Alert>
        ) : null}

        {currentCopyStatus === "failed" ? (
          <Alert variant="destructive">
            <AlertTitle>Copy failed</AlertTitle>
            <AlertDescription>
              The path could not be copied. You can still select it manually
              from the output path field.
            </AlertDescription>
          </Alert>
        ) : null}

        {currentOpenStatus?.status === "failed" ? (
          <Alert variant="destructive">
            <AlertTitle>Open folder failed</AlertTitle>
            <AlertDescription>
              {currentOpenStatus.message ??
                "The report location could not be opened."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 font-medium">{metric.value}</p>
            </div>
          ))}
        </div>

        {!compact ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">Output path</p>
            <p className="mt-2 break-all text-xs text-muted-foreground">
              {report.outputPath ??
                "Generate this report first to see the output path."}
            </p>
          </div>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Updated: {formatDateTime(report.updatedAt)}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!report.outputPath}
              onClick={() => onCopyPath(report)}
            >
              {currentCopyStatus === "copied" ? (
                <>
                  <Check className="size-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy path
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!report.outputPath}
              onClick={() => onOpenFolder(report)}
            >
              {currentOpenStatus?.status === "opened" ? (
                <>
                  <FolderOpen className="size-4" />
                  Opened
                </>
              ) : (
                <>
                  <FolderOpen className="size-4" />
                  Open folder
                </>
              )}
            </Button>

            <Button size="sm" onClick={() => onToolChange(report.actionTool)}>
              {report.actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}