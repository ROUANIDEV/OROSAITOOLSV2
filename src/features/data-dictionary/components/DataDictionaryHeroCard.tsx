import { Database, Loader2, PlayCircle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import { DataDictionaryStatusAlerts } from "@/features/data-dictionary/components/DataDictionaryStatusAlerts";

type DataDictionaryHeroCardProps = {
  selectedCscPath: string | null;
  state: DataDictionaryWorkspaceState;
  isAnalyzing: boolean;
  isExporting: boolean;
  canRun: boolean;
  onAnalyze: () => void;
  onExport: () => void;
  onGoToCProjectScanner: () => void;
};

export function DataDictionaryHeroCard({
  selectedCscPath,
  state,
  isAnalyzing,
  isExporting,
  canRun,
  onAnalyze,
  onExport,
  onGoToCProjectScanner,
}: DataDictionaryHeroCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Workspace</Badge>
          <Badge variant="outline">Data Dictionary</Badge>
        </div>

        <CardTitle className="flex items-center gap-2 text-2xl">
          <Database className="size-6" />
          Data Dictionary
        </CardTitle>

        <CardDescription>
          Analyze constants, global variables, and data types from the selected
          CSC, then export data_dictionnary.xlsx.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Selected CSC path</p>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            {selectedCscPath ?? "No CSC selected yet."}
          </p>
        </div>

        <DataDictionaryStatusAlerts
          selectedCscPath={selectedCscPath}
          state={state}
          isAnalyzing={isAnalyzing}
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={onAnalyze} disabled={!canRun}>
            {isAnalyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Analyze Data Dictionary
          </Button>

          <Button onClick={onExport} disabled={!canRun}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlayCircle className="size-4" />
            )}
            Generate data_dictionnary.xlsx
          </Button>

          <Button variant="outline" onClick={onGoToCProjectScanner}>
            Select CSC folder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}