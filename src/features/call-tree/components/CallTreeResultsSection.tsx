import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import { AnalysisResultCard } from "@/components/analysis/AnalysisResultCard";
import { CallTreeGraph } from "@/features/call-tree/CallTreeGraph";
import {
  CallTreeCallsTable,
  CallTreeFunctionsTable,
} from "@/features/call-tree/tables/CallTreeTables";
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
    return <AnalysisLoadingSkeleton />;
  }

  if (!state.analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      <CallTreeGraph analysis={state.analysis} functions={functions} calls={calls} />

      <AnalysisResultCard title="Functions">
        <CallTreeFunctionsTable functions={functions} />
      </AnalysisResultCard>

      <AnalysisResultCard
        title="Calls"
        description="Caller-to-callee relationships with pagination and per-column search."
      >
        <CallTreeCallsTable calls={calls} />
      </AnalysisResultCard>
    </div>
  );
}