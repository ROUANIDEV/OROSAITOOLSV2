import { AlertCircle, Network } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ReportsFolderStatus } from "@/features/reports/types/reportsTypes";

type ReportsOverviewStatusProps = {
  selectedCscPath: string | null;
  reportsFolderStatus: ReportsFolderStatus;
};

export function ReportsOverviewStatus({
  selectedCscPath,
  reportsFolderStatus,
}: ReportsOverviewStatusProps) {
  return (
    <>
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

      {reportsFolderStatus?.status === "failed" ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Open reports folder failed</AlertTitle>
          <AlertDescription>
            {reportsFolderStatus.message ??
              "The selected CSC folder could not be opened."}
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}