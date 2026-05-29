import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import { AnalysisResultCard } from "@/components/analysis/AnalysisResultCard";
import { DataDictionaryWorkspaceState } from "../../state";
import { ConstantsTable, DataTypesTable, GlobalVariablesTable } from "../../tables";

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