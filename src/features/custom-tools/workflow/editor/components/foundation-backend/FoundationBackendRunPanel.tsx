import {
  CheckCircle2,
  Info,
  Loader2,
  PlayCircle,
  TerminalSquare,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomToolBlockType } from "../../../../domain/customToolTypes";
import {
  runFoundationBackendPreview,
  type FoundationBackendDiagnostic,
  type FoundationBackendRunResult,
} from "../../../../runtime/foundationBackendRuntime";

type FoundationBackendRunPanelProps = {
  blockId: string;
  blockType: CustomToolBlockType;
  config: Record<string, unknown>;
};

function stringConfig(config: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = config[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function getPreviewLabel(
  blockType: CustomToolBlockType,
  config: Record<string, unknown>,
) {
  const configName = stringConfig(config, [
    "name",
    "functionName",
    "namespace",
    "itemName",
    "indexName",
  ]);

  return configName ? `${blockType}: ${configName}` : blockType;
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function severityClassName(severity: FoundationBackendDiagnostic["severity"]) {
  switch (severity) {
    case "error":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "warning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
}

function ResultStatusBadge({ result }: { result: FoundationBackendRunResult }) {
  if (result.ok) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      >
        Rust preview OK
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-destructive/30 bg-destructive/10 text-destructive"
    >
      Rust preview has errors
    </Badge>
  );
}

function DiagnosticsList({ diagnostics }: { diagnostics: FoundationBackendDiagnostic[] }) {
  if (diagnostics.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Rust returned no diagnostics for this block preview.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {diagnostics.map((diagnostic, index) => (
        <div
          key={`${diagnostic.severity}-${diagnostic.field ?? "general"}-${index}`}
          className={[
            "rounded-xl border p-3 text-xs",
            severityClassName(diagnostic.severity),
          ].join(" ")}
        >
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            {diagnostic.severity === "error" ? (
              <XCircle className="size-3.5" aria-hidden="true" />
            ) : diagnostic.severity === "warning" ? (
              <TriangleAlert className="size-3.5" aria-hidden="true" />
            ) : (
              <Info className="size-3.5" aria-hidden="true" />
            )}
            <span>{diagnostic.message}</span>
          </div>

          {diagnostic.help ? (
            <p className="mt-1 opacity-90">{diagnostic.help}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="rounded-xl border bg-background/70 p-3">
      <summary className="cursor-pointer text-xs font-semibold">{title}</summary>
      <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-muted p-3 text-[11px]">
        {formatJson(value)}
      </pre>
    </details>
  );
}

function getBlockOutput(result: FoundationBackendRunResult, blockId: string) {
  const directOutput = result.outputs[blockId];

  if (directOutput !== undefined) {
    return directOutput;
  }

  return result.outputs;
}

export function FoundationBackendRunPanel({
  blockId,
  blockType,
  config,
}: FoundationBackendRunPanelProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<FoundationBackendRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewPayload = useMemo(
    () => ({
      blocks: [
        {
          id: blockId,
          type: blockType,
          label: getPreviewLabel(blockType, config),
          config,
        },
      ],
      inputs: {},
      options: {
        dryRun: true,
        maxLoopIterations: 100,
        failFast: false,
      },
    }),
    [blockId, blockType, config],
  );

  const runPreview = async () => {
    setRunning(true);
    setError(null);

    try {
      const response = await runFoundationBackendPreview(previewPayload);
      setResult(response);
    } catch (runError) {
      setResult(null);
      setError(
        runError instanceof Error
          ? runError.message
          : "Rust foundation preview failed. Check the Tauri console for details.",
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border bg-card/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TerminalSquare className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Rust backend preview</h3>
          </div>

          <p className="text-xs text-muted-foreground">
            Run this foundation block through the Rust engine in dry-run mode.
            This validates that the UI contract and backend command agree.
          </p>
        </div>

        {result ? <ResultStatusBadge result={result} /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={runPreview} disabled={running}>
          {running ? (
            <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <PlayCircle className="mr-2 size-3.5" aria-hidden="true" />
          )}
          {running ? "Running Rust preview" : "Run Rust preview"}
        </Button>

        <Badge variant="secondary" className="text-[10px]">
          dry-run
        </Badge>

        <Badge variant="outline" className="text-[10px]">
          single block
        </Badge>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="flex items-center gap-2 font-semibold">
            <XCircle className="size-3.5" aria-hidden="true" />
            Rust command failed
          </div>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded-lg border bg-background/60 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Executed
              </p>
              <p className="mt-1 text-sm font-semibold">{result.executedCount}</p>
            </div>

            <div className="rounded-lg border bg-background/60 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Planned/skipped
              </p>
              <p className="mt-1 text-sm font-semibold">{result.plannedCount}</p>
            </div>

            <div className="rounded-lg border bg-background/60 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Errors
              </p>
              <p className="mt-1 text-sm font-semibold">{result.errorCount}</p>
            </div>

            <div className="rounded-lg border bg-background/60 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Warnings
              </p>
              <p className="mt-1 text-sm font-semibold">{result.warningCount}</p>
            </div>
          </div>

          <DiagnosticsList diagnostics={result.diagnostics} />

          <JsonBlock title="Step output" value={getBlockOutput(result, blockId)} />
          <JsonBlock title="Variables" value={result.variables} />
          <JsonBlock title="Constants" value={result.constants} />
          <JsonBlock title="Trace" value={result.trace} />
          <JsonBlock title="Full Rust response" value={result.raw} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
          Click <span className="font-semibold text-foreground">Run Rust preview</span> to
          send this block config to the Tauri backend command.
        </div>
      )}
    </section>
  );
}
