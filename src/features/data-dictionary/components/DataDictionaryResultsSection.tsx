import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import { AnalysisResultCard } from "@/components/analysis/AnalysisResultCard";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import {
  ConstantsTable,
  DataTypesTable,
  GlobalVariablesTable,
} from "@/features/data-dictionary/tables/DataDictionaryTables";

type DataDictionaryResultsSectionProps = {
  state: DataDictionaryWorkspaceState;
  isAnalyzing: boolean;
};

export function DataDictionaryResultsSection({
  state,
  isAnalyzing,
}: DataDictionaryResultsSectionProps) {
  if (isAnalyzing) {
    return <AnalysisLoadingSkeleton />;
  }

  if (!state.analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AnalysisResultCard title="Constants">
        <ConstantsTable constants={state.analysis.constants} />
      </AnalysisResultCard>

      <AnalysisResultCard title="Global Variables">
        <GlobalVariablesTable globalVariables={state.analysis.globalVariables} />
      </AnalysisResultCard>

      <AnalysisResultCard title="Data Types">
        <DataTypesTable dataTypes={state.analysis.dataTypes} />
      </AnalysisResultCard>
    </div>
  );
}