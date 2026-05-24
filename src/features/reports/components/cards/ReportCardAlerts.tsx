import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type {
  OpenStatus,
  ReportDetails,
} from "@/features/reports/types/reportsTypes";

type ReportCardAlertsProps = {
  report: ReportDetails;
  currentCopyStatus: "copied" | "failed" | null;
  currentOpenStatus: OpenStatus;
};

export function ReportCardAlerts({
  report,
  currentCopyStatus,
  currentOpenStatus,
}: ReportCardAlertsProps) {
  return (
    <>
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
    </>
  );
}