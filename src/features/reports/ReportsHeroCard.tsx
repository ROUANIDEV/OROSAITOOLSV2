import { AlertCircle, BarChart3, FolderOpen, Network } from "lucide-react";

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
import type { ToolId } from "@/features/dashboard/tool-config";
import type { ReportsFolderStatus } from "@/features/reports/reportsTypes";

type ReportsHeroCardProps = {
  selectedCscPath: string | null;
  generatedReportsCount: number;
  totalReportsCount: number;
  compactReportCards: boolean;
  reportsFolderStatus: ReportsFolderStatus;
  onToolChange: (tool: ToolId) => void;
  onOpenReportsFolder: () => void;
};

export function ReportsHeroCard({
  selectedCscPath,
  generatedReportsCount,
  totalReportsCount,
  compactReportCards,
  reportsFolderStatus,
  onToolChange,
  onOpenReportsFolder,
}: ReportsHeroCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Workspace</Badge>
          <Badge variant="outline">Reports</Badge>
          <Badge variant="secondary">
            {generatedReportsCount}/{totalReportsCount} generated
          </Badge>
          <Badge variant="outline">
            {compactReportCards ? "Compact mode" : "Comfort mode"}
          </Badge>
        </div>

        <CardTitle className="flex items-center gap-2 text-2xl">
          <BarChart3 className="size-6" />
          Reports
        </CardTitle>

        <CardDescription>
          Review generated Excel reports, copy output paths, open report
          folders, and jump back to the tool that creates each report.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {!selectedCscPath ? (
          <Alert>
            <Network className="size-4" />
            <AlertTitle>No CSC folder selected</AlertTitle>
            <AlertDescription>
              Select a CSC folder first so the reports workspace can show the
              expected output paths.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">Current CSC folder</p>
            <p className="mt-2 break-all text-xs text-muted-foreground">
              {selectedCscPath}
            </p>
          </div>
        )}

        {reportsFolderStatus?.status === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Open reports folder failed</AlertTitle>
            <AlertDescription>
              {reportsFolderStatus.message ??
                "The selected CSC folder could not be opened."}
            </AlertDescription>
          </Alert>
        )}

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
      </CardContent>
    </Card>
  );
}