import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CallTreeGraph } from "@/features/call-tree/CallTreeGraph";
import {
  CallTreeCallsTable,
  CallTreeFunctionsTable,
} from "@/features/call-tree/CallTreeTables";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import type { CallTreeCall, CallTreeFunction } from "@/lib/callTree";

type CallTreeResultsSectionProps = {
  state: CallTreeWorkspaceState;
  isAnalyzing: boolean;
  functions: CallTreeFunction[];
  calls: CallTreeCall[];
};

export function CallTreeResultsSection({
  state,
  isAnalyzing,
  functions,
  calls,
}: CallTreeResultsSectionProps) {
  if (isAnalyzing) {
    return (
      <AnalysisLoadingSkeleton
        title="Analyzing Call Tree..."
        description="Detecting functions, callers, callees, and call relationships."
      />
    );
  }

  if (!state.analysis) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <CallTreeGraph
        analysis={state.analysis}
        functions={functions}
        calls={calls}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Functions</CardTitle>
          <CardDescription>
            Search all columns or filter each column. Default view shows 20 rows.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CallTreeFunctionsTable functions={functions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calls</CardTitle>
          <CardDescription>
            Caller-to-callee relationships with pagination and per-column search.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CallTreeCallsTable calls={calls} />
        </CardContent>
      </Card>
    </section>
  );
}