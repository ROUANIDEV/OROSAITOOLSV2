import type { Dispatch, SetStateAction } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  GitBranch,
  Loader2,
  Network,
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
import { CallTreeGraph } from "@/features/call-tree/CallTreeGraph";
import {
  CallTreeCallsTable,
  CallTreeFunctionsTable,
} from "@/features/call-tree/CallTreeTables";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import {
  analyzeCallTree,
  exportCallTreeXlsx,
  type CallTreeAnalysisResult,
  type CallTreeCall,
  type CallTreeFunction,
} from "@/lib/callTree";

type CallTreeWorkspaceProps = {
  selectedCscPath: string | null;
  onGoToCProjectScanner: () => void;
  state: CallTreeWorkspaceState;
  onStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>;
};

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

  const functions = getFunctions(state.analysis);
  const calls = getCalls(state.analysis);

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

      const result = await analyzeCallTree(selectedCscPath);

      onStateChange((current) => ({
        ...current,
        status: "ready",
        analysis: result,
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

      const result = await exportCallTreeXlsx(selectedCscPath);

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
              <Badge variant="outline">Call Tree</Badge>
            </div>

            <CardTitle className="flex items-center gap-2 text-2xl">
              <GitBranch className="size-6" />
              Call Tree
            </CardTitle>

            <CardDescription>
              Analyze function relationships from the selected CSC, preview the
              result, then export call_tree.xlsx.
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
                <Network className="size-4" />
                <AlertTitle>No CSC selected</AlertTitle>
                <AlertDescription>
                  Open C Project Scanner, choose a project folder, scan it, and
                  select a CSC folder before using Call Tree.
                </AlertDescription>
              </Alert>
            )}

            {state.error && (
              <Alert variant="destructive">
                <AlertTitle>Call Tree error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {isAnalyzing && (
              <Alert>
                <Loader2 className="size-4 animate-spin" />
                <AlertTitle>Analyzing Call Tree</AlertTitle>
                <AlertDescription>
                  Detecting functions, callers, callees, and call relationships.
                </AlertDescription>
              </Alert>
            )}

            {!isAnalyzing && state.analysis && (
              <Alert>
                <CheckCircle2 className="size-4" />
                <AlertTitle>Analysis ready</AlertTitle>
                <AlertDescription>
                  Found{" "}
                  {getResultNumber(state.analysis, [
                    "functionsCount",
                    "functionCount",
                  ])}{" "}
                  functions and{" "}
                  {getResultNumber(state.analysis, [
                    "callsCount",
                    "callCount",
                    "edgesCount",
                  ])}{" "}
                  calls.
                </AlertDescription>
              </Alert>
            )}

            {state.exportResult && (
              <Alert>
                <CheckCircle2 className="size-4" />
                <AlertTitle>Call Tree exported</AlertTitle>
                <AlertDescription>
                  call_tree.xlsx was generated successfully.
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
                Analyze Call Tree
              </Button>

              <Button onClick={handleExport} disabled={!canRun}>
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlayCircle className="size-4" />
                )}
                Generate call_tree.xlsx
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
                  value={getResultNumber(state.analysis, ["sourceFiles"])}
                />
                <InfoRow
                  label="Header files"
                  value={getResultNumber(state.analysis, ["headerFiles"])}
                />
                <InfoRow
                  label="Functions"
                  value={getResultNumber(state.analysis, [
                    "functionsCount",
                    "functionCount",
                  ])}
                />
                <InfoRow
                  label="Calls"
                  value={getResultNumber(state.analysis, [
                    "callsCount",
                    "callCount",
                    "edgesCount",
                  ])}
                />
                <InfoRow
                  label="Root functions"
                  value={getResultNumber(state.analysis, [
                    "rootFunctionsCount",
                    "rootFunctionCount",
                    "rootCount",
                  ])}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Click Analyze Call Tree to show summary, graph, and tables.
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
          title="Analyzing Call Tree..."
          description="Detecting functions, callers, callees, and call relationships."
        />
      ) : state.analysis ? (
        <section className="grid gap-4">
          <CallTreeGraph
            analysis={state.analysis}
            functions={functions}
            calls={calls}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Functions</CardTitle>
              <CardDescription>
                Search all columns or filter each column. Default view shows 20
                rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CallTreeFunctionsTable functions={functions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calls</CardTitle>
              <CardDescription>
                Caller-to-callee relationships with pagination and per-column
                search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CallTreeCallsTable calls={calls} />
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

function getResultNumber(result: unknown, keys: string[]): string | number {
  const record = asRecord(result);

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "—";
}

function getFunctions(
  analysis: CallTreeAnalysisResult | null,
): CallTreeFunction[] {
  if (!analysis) {
    return [];
  }

  return mergeArrays<CallTreeFunction>([
    getArrayField(analysis, [
      "functions",
      "functionItems",
      "function_items",
      "allFunctions",
      "all_functions",
      "nodes",
      "functionPreview",
      "function_preview",
    ]),
  ]);
}

function getCalls(analysis: CallTreeAnalysisResult | null): CallTreeCall[] {
  if (!analysis) {
    return [];
  }

  return mergeArrays<CallTreeCall>([
    getArrayField(analysis, [
      "calls",
      "callItems",
      "call_items",
      "functionCalls",
      "function_calls",
    ]),
    getArrayField(analysis, [
      "edges",
      "callEdges",
      "call_edges",
      "relationships",
      "callRelationships",
      "call_relationships",
    ]),
  ]);
}

function getArrayField<T>(value: unknown, keys: string[]): T[] {
  const record = asRecord(value);
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const fieldValue = record[realKey];

    if (Array.isArray(fieldValue)) {
      return fieldValue as T[];
    }
  }

  return [];
}

function mergeArrays<T>(arrays: T[][]): T[] {
  const result: T[] = [];

  for (const array of arrays) {
    for (const item of array) {
      result.push(item);
    }
  }

  return result;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeKey(value: string): string {
  return value.replace(/[_\-\s]/g, "").toLowerCase();
}