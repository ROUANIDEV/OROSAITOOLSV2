import { CheckCircle2, Loader2, Network } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import { getResultNumber } from "@/features/call-tree/callTreeSelectors";

type CallTreeStatusAlertsProps = {
  selectedCscPath: string | null;
  state: CallTreeWorkspaceState;
  isAnalyzing: boolean;
};

export function CallTreeStatusAlerts({
  selectedCscPath,
  state,
  isAnalyzing,
}: CallTreeStatusAlertsProps) {
  return (
    <>
      {!selectedCscPath && (
        <Alert>
          <Network className="size-4" />
          <AlertTitle>No CSC selected</AlertTitle>
          <AlertDescription>
            Open C Project Scanner, choose a project folder, scan it, and select
            a CSC folder before using Call Tree.
          </AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Call Tree error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {isAnalyzing && (
        <Alert>
          <Loader2 className="size-4 animate-spin" />
          <AlertTitle>Analyzing Call Tree</AlertTitle>
          <AlertDescription>
            Detecting functions, callers, callees, and call relationships.
          </AlertDescription>
        </Alert>
      )}

      {!isAnalyzing && state.analysis && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Analysis ready</AlertTitle>
          <AlertDescription>
            Found{" "}
            {getResultNumber(state.analysis, ["functionsCount", "functionCount"])}
            {" "}functions and{" "}
            {getResultNumber(state.analysis, [
              "callsCount",
              "callCount",
              "edgesCount",
            ])}
            {" "}calls.
          </AlertDescription>
        </Alert>
      )}

      {state.exportResult && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Call Tree exported</AlertTitle>
          <AlertDescription>
            call_tree.xlsx was generated successfully.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}