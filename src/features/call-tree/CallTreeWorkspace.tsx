import { CallTreeHeroCard } from "@/features/call-tree/components/CallTreeHeroCard";
import { CallTreeResultsSection } from "@/features/call-tree/components/CallTreeResultsSection";
import { CallTreeSummaryCard } from "@/features/call-tree/components/CallTreeSummaryCard";
import {
  getCallTreeCalls,
  getCallTreeFunctions,
} from "@/features/call-tree/selectors/callTreeSelectors";
import type { CallTreeWorkspaceProps } from "@/features/call-tree/types/callTreeWorkspaceTypes";
import { useCallTreeActions } from "@/features/call-tree/hooks/useCallTreeActions";

export function CallTreeWorkspace({
  selectedCscPath,
  onGoToCProjectScanner,
  state,
  onStateChange,
}: CallTreeWorkspaceProps) {
  const isAnalyzing = state.status === "analyzing";
  const isExporting = state.status === "exporting";
  const isBusy = isAnalyzing || isExporting;
  const canRun = Boolean(selectedCscPath) && !isBusy;

  const functions = getCallTreeFunctions(state.analysis);
  const calls = getCallTreeCalls(state.analysis);

  const { handleAnalyze, handleExport } = useCallTreeActions({
    selectedCscPath,
    onStateChange,
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <CallTreeHeroCard
          selectedCscPath={selectedCscPath}
          state={state}
          isAnalyzing={isAnalyzing}
          isExporting={isExporting}
          canRun={canRun}
          onAnalyze={handleAnalyze}
          onExport={handleExport}
          onGoToCProjectScanner={onGoToCProjectScanner}
        />

        <CallTreeSummaryCard state={state} isAnalyzing={isAnalyzing} />
      </section>

      <CallTreeResultsSection
        state={state}
        isAnalyzing={isAnalyzing}
        functions={functions}
        calls={calls}
      />
    </main>
  );
}