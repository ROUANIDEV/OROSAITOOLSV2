import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ToolId } from "@/features/dashboard/tool-config";
import type { ReportsFolderStatus } from "@/features/reports/types/reportsTypes";

type ReportsOverviewActionsProps = {
  selectedCscPath: string | null;
  reportsFolderStatus: ReportsFolderStatus;
  onToolChange: (tool: ToolId) => void;
  onOpenReportsFolder: () => void;
};

export function ReportsOverviewActions({
  selectedCscPath,
  reportsFolderStatus,
  onToolChange,
  onOpenReportsFolder,
}: ReportsOverviewActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => onToolChange("c-project")}>
        Select CSC Folder
      </Button>

      <Button
        variant="outline"
        disabled={!selectedCscPath}
        onClick={onOpenReportsFolder}
      >
        <FolderOpen className="size-4" />
        {reportsFolderStatus?.status === "opened"
          ? "Opened"
          : "Open reports folder"}
      </Button>

      <Button variant="outline" onClick={() => onToolChange("call-tree")}>
        Open Call Tree
      </Button>

      <Button
        variant="outline"
        onClick={() => onToolChange("data-dictionary")}
      >
        Open Data Dictionary
      </Button>
    </div>
  );
}