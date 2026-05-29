import { Check, Copy, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, OpenStatus, ReportDetails } from "../../model";
import { ToolId } from "@/features/dashboard";

type ReportCardActionsProps = {
  report: ReportDetails;
  currentCopyStatus: "copied" | "failed" | null;
  currentOpenStatus: OpenStatus;
  onCopyPath: (report: ReportDetails) => void;
  onOpenFolder: (report: ReportDetails) => void;
  onToolChange: (tool: ToolId) => void;
};

export function ReportCardActions({
  report,
  currentCopyStatus,
  currentOpenStatus,
  onCopyPath,
  onOpenFolder,
  onToolChange,
}: ReportCardActionsProps) {
  return (
    <>
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
    </>
  );
}