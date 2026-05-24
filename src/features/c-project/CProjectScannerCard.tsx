import { Clock3, FileCode2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";
import { CProjectCscFoldersCard } from "@/features/c-project/CProjectCscFoldersCard";
import { CProjectScannerActionsBar } from "@/features/c-project/CProjectScannerActionsBar";
import { CProjectScannerAlerts } from "@/features/c-project/CProjectScannerAlerts";
import { CProjectStatusBadge } from "@/features/c-project/CProjectStatusBadge";
import { CProjectSummaryStats } from "@/features/c-project/CProjectSummaryStats";
import type { CProjectScannerActions } from "@/features/c-project/cProjectWorkspaceTypes";
import { formatDateTime } from "@/features/c-project/cProjectWorkspaceUtils";

type CProjectScannerCardProps = CProjectScannerActions & {
  state: CProjectWorkspaceState;
  isPickingFolder: boolean;
  isScanning: boolean;
};

export function CProjectScannerCard({
  state,
  isPickingFolder,
  isScanning,
  onChooseFolder,
  onScanProject,
  onClearScanner,
  onSelectCsc,
}: CProjectScannerCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Workspace</Badge>
          <Badge variant="outline">C Project Scanner</Badge>
          <CProjectStatusBadge status={state.status} />
        </div>

        <CardTitle className="flex items-center gap-2 text-2xl">
          <FileCode2 className="size-6" />
          C Project Scanner
        </CardTitle>

        <CardDescription>
          Select a C project folder, scan files, and detect CSC folders for the
          other tools. The scan result is remembered when you navigate away.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-xl border bg-muted/30 p-4">
          <CProjectScannerActionsBar
            hasProjectPath={Boolean(state.projectPath)}
            isPickingFolder={isPickingFolder}
            isScanning={isScanning}
            onChooseFolder={onChooseFolder}
            onScanProject={onScanProject}
            onClearScanner={onClearScanner}
            onSelectCsc={onSelectCsc}
          />

          <div className="rounded-lg border bg-background px-3 py-2 text-sm">
            <span className="font-medium">Project path: </span>
            <span className="break-all text-muted-foreground">
              {state.projectPath || "No folder selected yet"}
            </span>
          </div>

          {state.lastScannedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              Last scan: {formatDateTime(state.lastScannedAt)}
            </div>
          )}
        </div>

        <CProjectScannerAlerts state={state} isScanning={isScanning} />
        <CProjectSummaryStats state={state} />

        <CProjectCscFoldersCard
          state={state}
          isScanning={isScanning}
          onSelectCsc={onSelectCsc}
        />
      </CardContent>
    </Card>
  );
}