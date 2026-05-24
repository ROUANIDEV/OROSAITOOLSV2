import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ToolId } from "@/features/dashboard/tool-config";
import { ReportStatCard } from "@/features/reports/components/cards/ReportStatCard";
import { ReportsOverviewActions } from "@/features/reports/components/cards/ReportsOverviewActions";
import { ReportsOverviewStatus } from "@/features/reports/components/cards/ReportsOverviewStatus";
import type { ReportsFolderStatus } from "@/features/reports/types/reportsTypes";

type ReportsOverviewCardProps = {
  selectedCscPath: string | null;
  generatedReportsCount: number;
  totalReportsCount: number;
  readyReportsCount: number;
  compactReportCards: boolean;
  reportsFolderStatus: ReportsFolderStatus;
  onToolChange: (tool: ToolId) => void;
  onOpenReportsFolder: () => void;
};

export function ReportsOverviewCard({
  selectedCscPath,
  generatedReportsCount,
  totalReportsCount,
  readyReportsCount,
  compactReportCards,
  reportsFolderStatus,
  onToolChange,
  onOpenReportsFolder,
}: ReportsOverviewCardProps) {
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
          Review the Excel reports generated from the selected CSC folder, copy
          output paths, open report folders, and jump back to the tool that
          creates each report.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <ReportsOverviewStatus
          selectedCscPath={selectedCscPath}
          reportsFolderStatus={reportsFolderStatus}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <ReportStatCard label="Report types" value={totalReportsCount} />
          <ReportStatCard label="Ready reports" value={readyReportsCount} />
          <ReportStatCard
            label="Generated files"
            value={generatedReportsCount}
          />
        </section>

        <ReportsOverviewActions
          selectedCscPath={selectedCscPath}
          reportsFolderStatus={reportsFolderStatus}
          onToolChange={onToolChange}
          onOpenReportsFolder={onOpenReportsFolder}
        />
      </CardContent>
    </Card>
  );
}