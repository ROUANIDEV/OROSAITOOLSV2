import { DataDictionaryWorkspaceProps } from "../../model";
import { useDataDictionaryActions } from "../hooks";
import { DataDictionaryHeroCard } from "./DataDictionaryHeroCard";
import { DataDictionaryResultsSection } from "./DataDictionaryResultsSection";
import { DataDictionarySummaryCard } from "./DataDictionarySummaryCard";

export function DataDictionaryWorkspace({
  selectedCscPath,
  onGoToCProjectScanner,
  state,
  onStateChange,
}: DataDictionaryWorkspaceProps) {
  const isAnalyzing = state.status === "analyzing";
  const isExporting = state.status === "exporting";
  const isBusy = isAnalyzing || isExporting;
  const canRun = Boolean(selectedCscPath) && !isBusy;

  const { handleAnalyze, handleExport } = useDataDictionaryActions({
    selectedCscPath,
    onStateChange,
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DataDictionaryHeroCard
          selectedCscPath={selectedCscPath}
          state={state}
          isAnalyzing={isAnalyzing}
          isExporting={isExporting}
          canRun={canRun}
          onAnalyze={handleAnalyze}
          onExport={handleExport}
          onGoToCProjectScanner={onGoToCProjectScanner}
        />

        <DataDictionarySummaryCard
          state={state}
          isAnalyzing={isAnalyzing}
        />
      </section>

      <DataDictionaryResultsSection
        state={state}
        isAnalyzing={isAnalyzing}
      />
    </main>
  );
}