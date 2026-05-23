import type { Dispatch, SetStateAction } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  PlayCircle,
  Search,
} from "lucide-react";

import { AnalysisLoadingSkeleton } from "@/components/analysis/AnalysisLoadingSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import {
  ConstantsTable,
  DataTypesTable,
  GlobalVariablesTable,
} from "@/features/data-dictionary/DataDictionaryTables";
import {
  analyzeDataDictionary,
  exportDataDictionaryXlsx,
  type DataDictionaryAnalysisResult,
} from "@/lib/dataDictionary";

type DataDictionaryWorkspaceProps = {
  selectedCscPath: string | null;
  onGoToCProjectScanner: () => void;
  state: DataDictionaryWorkspaceState;
  onStateChange: Dispatch<SetStateAction<DataDictionaryWorkspaceState>>;
};

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

  async function handleAnalyze() {
    if (!selectedCscPath) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: "Select a CSC folder first from the C Project Scanner.",
      }));
      return;
    }

    try {
      onStateChange((current) => ({
        ...current,
        status: "analyzing",
        error: null,
      }));

      const result = await analyzeDataDictionary(selectedCscPath);

      onStateChange((current) => ({
        ...current,
        status: "ready",
        analysis: normalizeAnalysisResult(result),
        error: null,
        lastAnalyzedAt: new Date().toISOString(),
      }));
    } catch (err) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  async function handleExport() {
    if (!selectedCscPath) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: "Select a CSC folder first from the C Project Scanner.",
      }));
      return;
    }

    try {
      onStateChange((current) => ({
        ...current,
        status: "exporting",
        error: null,
        exportResult: null,
      }));

      const result = await exportDataDictionaryXlsx(selectedCscPath);

      onStateChange((current) => ({
        ...current,
        status: "ready",
        exportResult: result,
        error: null,
        lastExportedAt: new Date().toISOString(),
      }));
    } catch (err) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Workspace</Badge>
              <Badge variant="outline">Data Dictionary</Badge>
            </div>

            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="size-6" />
              Data Dictionary
            </CardTitle>

            <CardDescription>
              Analyze constants, global variables, and data types from the
              selected CSC, then export data_dictionnary.xlsx.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Selected CSC path</p>
              <p className="mt-2 break-all text-sm text-muted-foreground">
                {selectedCscPath ?? "No CSC selected yet."}
              </p>
            </div>

            {!selectedCscPath && (
              <Alert>
                <Database className="size-4" />
                <AlertTitle>No CSC selected</AlertTitle>
                <AlertDescription>
                  Open C Project Scanner, choose a project folder, scan it, and
                  select a CSC folder before using Data Dictionary.
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
                  Extracting constants, global variables, data types, and
                  references.
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

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAnalyze} disabled={!canRun}>
                {isAnalyzing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Analyze Data Dictionary
              </Button>

              <Button onClick={handleExport} disabled={!canRun}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>
              Latest analysis and export information.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {isAnalyzing ? (
              <SummarySkeleton />
            ) : state.analysis ? (
              <div className="grid gap-3 text-sm">
                <InfoRow
                  label="Source files"
                  value={state.analysis.sourceFiles}
                />
                <InfoRow
                  label="Header files"
                  value={state.analysis.headerFiles}
                />
                <InfoRow
                  label="Constants"
                  value={state.analysis.constantsCount}
                />
                <InfoRow
                  label="Global variables"
                  value={state.analysis.globalVariablesCount}
                />
                <InfoRow
                  label="Data types"
                  value={state.analysis.dataTypesCount}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Click Analyze Data Dictionary to show summary and tables.
              </div>
            )}

            {state.exportResult && (
              <>
                <Separator />

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Generated file</p>
                  </div>

                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {state.exportResult.outputPath}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {isAnalyzing ? (
        <AnalysisLoadingSkeleton
          title="Analyzing Data Dictionary..."
          description="Extracting constants, global variables, data types, and references."
        />
      ) : state.analysis ? (
        <section className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Constants</CardTitle>
              <CardDescription>
                Search all columns or filter each column. Default view shows 20
                rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConstantsTable constants={state.analysis.constants ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Global Variables</CardTitle>
              <CardDescription>
                Search all columns or filter each column. Default view shows 20
                rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalVariablesTable
                globalVariables={state.analysis.globalVariables ?? []}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Types</CardTitle>
              <CardDescription>
                Search all columns or filter each column. Default view shows 20
                rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTypesTable dataTypes={state.analysis.dataTypes ?? []} />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

function normalizeAnalysisResult(
  result: DataDictionaryAnalysisResult,
): DataDictionaryAnalysisResult {
  return {
    ...result,
    constants: result.constants ?? [],
    globalVariables: result.globalVariables ?? [],
    dataTypes: result.dataTypes ?? [],
    constantsCount: result.constantsCount ?? result.constants?.length ?? 0,
    globalVariablesCount:
      result.globalVariablesCount ?? result.globalVariables?.length ?? 0,
    dataTypesCount: result.dataTypesCount ?? result.dataTypes?.length ?? 0,
  };
}