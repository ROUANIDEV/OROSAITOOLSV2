import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";

type CProjectScannerAlertsProps = {
  state: CProjectWorkspaceState;
  isScanning: boolean;
};

export function CProjectScannerAlerts({
  state,
  isScanning,
}: CProjectScannerAlertsProps) {
  return (
    <>
      {isScanning && (
        <Alert>
          <Loader2 className="size-4 animate-spin" />
          <AlertTitle>Scanning project in background</AlertTitle>
          <AlertDescription>
            You can keep using the UI. The previous scan result stays visible
            until the new scan finishes.
          </AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Scanner error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}