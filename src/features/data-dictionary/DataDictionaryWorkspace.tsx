import { DataDictionaryHeroCard } from "@/features/data-dictionary/DataDictionaryHeroCard";
import { DataDictionaryResultsSection } from "@/features/data-dictionary/DataDictionaryResultsSection";
import { DataDictionarySummaryCard } from "@/features/data-dictionary/DataDictionarySummaryCard";
import type { DataDictionaryWorkspaceProps } from "@/features/data-dictionary/dataDictionaryWorkspaceTypes";
import { useDataDictionaryActions } from "@/features/data-dictionary/useDataDictionaryActions";

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