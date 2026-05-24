import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    return (
      <AnalysisLoadingSkeleton
        title="Analyzing Data Dictionary..."
        description="Extracting constants, global variables, data types, and references."
      />
    );
  }

  if (!state.analysis) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <DataDictionaryTableCard title="Constants">
        <ConstantsTable constants={state.analysis.constants} />
      </DataDictionaryTableCard>

      <DataDictionaryTableCard title="Global Variables">
        <GlobalVariablesTable
          globalVariables={state.analysis.globalVariables}
        />
      </DataDictionaryTableCard>

      <DataDictionaryTableCard title="Data Types">
        <DataTypesTable dataTypes={state.analysis.dataTypes} />
      </DataDictionaryTableCard>
    </section>
  );
}

function DataDictionaryTableCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          Search all columns or filter each column. Default view shows 20 rows.
        </CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}