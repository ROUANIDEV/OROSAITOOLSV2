import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import type { CallTreeCall, CallTreeFunction } from "@/lib/callTree";
import { CallTreeWorkspaceState } from "../../state";
import { CallTreeGraph } from "../../graph";
import { CallTreeCallsTable, CallTreeFunctionsTable } from "../../tables";
import { AnalysisResultCard } from "@/components/analysis/AnalysisResultCard";

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