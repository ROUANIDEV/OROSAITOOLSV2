import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataDictionaryWorkspaceState } from "../../state";

type DataDictionaryStatusAlertsProps = {
  selectedCscPath: string | null;
  state: DataDictionaryWorkspaceState;
  isAnalyzing: boolean;
};

export function DataDictionaryStatusAlerts({
  selectedCscPath,
  state,
  isAnalyzing,
}: DataDictionaryStatusAlertsProps) {
  return (
    <>
      {!selectedCscPath && (
        <Alert>
          <BookOpen className="size-4" />
          <AlertTitle>No CSC selected</AlertTitle>
          <AlertDescription>
            Open C Project Scanner, choose a project folder, scan it, and select
            a CSC folder before using Data Dictionary.
          </AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Data Dictionary error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {isAnalyzing && (
        <Alert>
          <Loader2 className="size-4 animate-spin" />
          <AlertTitle>Analyzing Data Dictionary</AlertTitle>
          <AlertDescription>
            Extracting constants, global variables, data types, and references.
          </AlertDescription>
        </Alert>
      )}

      {!isAnalyzing && state.analysis && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Analysis ready</AlertTitle>
          <AlertDescription>
            Found {state.analysis.constantsCount} constants,{" "}
            {state.analysis.globalVariablesCount} global variables, and{" "}
            {state.analysis.dataTypesCount} data types.
          </AlertDescription>
        </Alert>
      )}

      {state.exportResult && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Excel exported</AlertTitle>
          <AlertDescription>
            data_dictionnary.xlsx was generated successfully.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}