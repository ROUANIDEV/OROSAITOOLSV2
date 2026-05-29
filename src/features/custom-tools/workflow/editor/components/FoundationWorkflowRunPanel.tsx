import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  GitBranch,
  ListChecks,
  Route,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createFoundationOutputTimeline,
  createFoundationWorkflowOutputSummary,
  type FoundationRuntimeDiagnostic,
  type FoundationRuntimeTraceItem,
  type FoundationWorkflowExecutionEdge,
  type FoundationWorkflowOutputItem,
  type FoundationWorkflowRunReport,
} from "../../../runtime/foundationWorkflowRuntime";

type FoundationWorkflowRunPanelProps = {
  open?: boolean;
  isRunning?: boolean;
  report: FoundationWorkflowRunReport | null;
  error?: string | null;
  onClose?: () => void;
};

function stringifyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeDiagnosticBlockId(diagnostic: FoundationRuntimeDiagnostic) {
  return diagnostic.blockId ?? diagnostic.block_id ?? null;
}

function normalizeTraceBlockId(trace: FoundationRuntimeTraceItem) {
  return trace.blockId ?? trace.block_id ?? "unknown-block";
}

function normalizeTraceBlockType(trace: FoundationRuntimeTraceItem) {
  return trace.blockType ?? trace.block_type ?? "unknown";
}

function statusClasses(ok?: boolean) {
  if (ok) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-900";
  return "border-destructive/40 bg-destructive/10 text-destructive";
}

function outputRoleLabel(item: FoundationWorkflowOutputItem) {
  if (item.role === "terminal") return "Workflow output";
  if (item.role === "blockOrder") return "Block output";
  if (item.role === "cycleFallback") return "Cycle/intermediate output";
  return "Intermediate output";
}

function outputRoleClasses(item: FoundationWorkflowOutputItem) {
  if (item.isWorkflowOutput) {
    return "border-primary/50 bg-primary/10 text-primary";
  }

  return "border-muted-foreground/20 bg-muted/50 text-muted-foreground";
}

function MiniStat({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">
        {String(value ?? 0)}
      </div>
    </div>
  );
}

function CodeBox({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-md border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
      {stringifyJson(value)}
    </pre>
  );
}

function OutputCard({
  item,
  index,
  important = false,
}: {
  item: FoundationWorkflowOutputItem;
  index: number;
  important?: boolean;
}) {
  return (
    <div
      className={
        important
          ? "rounded-xl border-2 border-primary/50 bg-background p-4 shadow-sm"
          : "rounded-lg border bg-background p-3"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              #{index + 1} {item.label}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${outputRoleClasses(
                item,
              )}`}
            >
              {outputRoleLabel(item)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {item.blockType} · output key <span className="font-mono">{item.primaryKey}</span>
          </div>
        </div>

        <div className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
          in {item.incomingArrowCount} · out {item.outgoingArrowCount}
        </div>
      </div>

      <pre
        className={
          important
            ? "mt-3 whitespace-pre-wrap wrap-break-word rounded-md bg-primary/5 p-4 font-sans text-lg font-semibold text-foreground"
            : "mt-3 whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 text-xs text-foreground"
        }
      >
        {item.displayValue}
      </pre>

      <div className="mt-2 text-xs text-muted-foreground">{item.reason}</div>
    </div>
  );
}

function ExecutionEdgeCard({ edge, index }: { edge: FoundationWorkflowExecutionEdge; index: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-background via-background to-primary/5 p-3 shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Data flow #{index + 1}
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {edge.fromLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            {edge.fromType} · {edge.fromPortId || "output"}
          </div>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <div className="h-px w-10 bg-primary/50" />
          <Sparkles className="size-4" />
          <ArrowRight className="size-4" />
          <div className="h-px w-10 bg-primary/50" />
        </div>

        <div className="min-w-0 space-y-1 text-left md:text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Input target
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {edge.toLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            {edge.toType} · {edge.toPortId || "input"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FoundationWorkflowRunPanel({
  open = true,
  isRunning = false,
  report,
  error,
  onClose,
}: FoundationWorkflowRunPanelProps) {
  const [copied, setCopied] = useState(false);

  const timeline = useMemo(
    () => (report ? createFoundationOutputTimeline(report) : []),
    [report],
  );
  const outputSummary = useMemo(
    () => (report ? createFoundationWorkflowOutputSummary(report) : null),
    [report],
  );

  if (!open && !isRunning && !report && !error) return null;

  const diagnostics = report?.result.diagnostics ?? [];
  const trace = report?.result.trace ?? report?.result.steps ?? [];
  const ok = report?.result.ok;
  const executedCount =
    report?.result.executedCount ?? report?.result.executed_count ?? 0;
  const plannedCount =
    report?.result.plannedCount ?? report?.result.planned_count ?? 0;
  const warningCount =
    report?.result.warningCount ?? report?.result.warning_count ?? 0;
  const errorCount = report?.result.errorCount ?? report?.result.error_count ?? 0;
  const executionEdges = report?.executionPlan.edges ?? [];
  const ignoredEdges = report?.executionPlan.ignoredEdges ?? [];
  const workflowOutputs = outputSummary?.workflowOutputs ?? [];
  const intermediateOutputs = outputSummary?.intermediateOutputs ?? [];

  const copyReport = async () => {
    if (!report) return;

    try {
      await navigator.clipboard.writeText(stringifyJson(report));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="mt-3 w-full border-2 border-primary/40 bg-background shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="size-4" />
              Rust Workflow Run Result
            </CardTitle>
            <CardDescription>
              The workflow no longer guesses one final value from the last block. It shows terminal arrow outputs, or all emitted outputs when no arrows are connected.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {report ? (
              <Button type="button" variant="outline" size="sm" onClick={copyReport}>
                <Copy className="mr-2 size-3.5" />
                {copied ? "Copied" : "Copy report"}
              </Button>
            ) : null}
            {onClose ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <X className="mr-2 size-3.5" />
                Hide
              </Button>
            ) : null}
          </div>
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Clock className="size-4 animate-pulse" />
            Running foundation blocks through Rust...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <div className="flex items-start gap-2 font-medium">
              <AlertCircle className="mt-0.5 size-4" />
              <span>Rust workflow run failed</span>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-xs">{error}</div>
          </div>
        ) : null}

        {report ? (
          <div className={`rounded-md border px-3 py-2 text-sm ${statusClasses(ok)}`}>
            <div className="flex items-center gap-2 font-semibold">
              {ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              <span>{ok ? "ok true" : "ok false"}</span>
            </div>
          </div>
        ) : null}
      </CardHeader>

      {report ? (
        <CardContent className="space-y-4">
          <section className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                  <FileText className="size-4" />
                  Workflow Outputs
                </div>
                <div className="text-xs text-muted-foreground">
                  {outputSummary?.explanation}
                </div>
              </div>
              <div className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {outputSummary?.modeLabel ?? "outputs"}
              </div>
            </div>

            {workflowOutputs.length > 0 ? (
              <div className="mt-3 space-y-3">
                {workflowOutputs.map((item, index) => (
                  <OutputCard
                    key={`${item.blockId}-${item.primaryKey}`}
                    item={item}
                    index={index}
                    important
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-md border bg-background p-3 text-sm text-muted-foreground">
                No workflow outputs were returned by Rust. Check diagnostics and Raw Rust Result below.
              </div>
            )}

            {intermediateOutputs.length > 0 ? (
              <details className="mt-3 rounded-md border bg-background p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Intermediate outputs feeding other blocks ({intermediateOutputs.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {intermediateOutputs.map((item, index) => (
                    <OutputCard
                      key={`${item.blockId}-${item.primaryKey}-intermediate`}
                      item={item}
                      index={index}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </section>

          <section className="rounded-xl border bg-linear-to-br from-primary/10 via-background to-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <GitBranch className="size-4" />
                  Execution route
                </div>
                <div className="text-xs text-muted-foreground">
                  Order mode: <span className="font-medium text-foreground">{report.orderLabel}</span>
                </div>
              </div>
              <div className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {executionEdges.length} active arrow{executionEdges.length === 1 ? "" : "s"}
              </div>
            </div>

            {report.executionPlan.hasCycle ? (
              <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900">
                Cycle detected. Blocks in the cycle were appended after the sorted arrow order so Rust can still run.
              </div>
            ) : null}

            {executionEdges.length > 0 ? (
              <div className="mt-3 space-y-2">
                {executionEdges.map((edge, index) => (
                  <ExecutionEdgeCard key={edge.id} edge={edge} index={index} />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-md border bg-background p-3 text-sm text-muted-foreground">
                No foundation-to-foundation arrows were found, so execution used the current block order.
              </div>
            )}

            {ignoredEdges.length > 0 ? (
              <details className="mt-3 rounded-md border bg-background p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Ignored visual arrows ({ignoredEdges.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {ignoredEdges.map((edge) => (
                    <div key={edge.id} className="rounded border bg-muted/30 p-2 text-xs text-muted-foreground">
                      {edge.fromLabel} → {edge.toLabel}: {edge.reason}
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </section>

          <section className="grid gap-2 sm:grid-cols-5">
            <MiniStat label="Executed" value={executedCount} />
            <MiniStat label="Planned" value={plannedCount} />
            <MiniStat label="Errors" value={errorCount} />
            <MiniStat label="Warnings" value={warningCount} />
            <MiniStat label="Skipped UI blocks" value={report.skippedBlocks.length} />
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="size-4" />
              Full output timeline
            </div>

            {timeline.length > 0 ? (
              <div className="space-y-2">
                {timeline.map((item, index) => (
                  <div
                    key={item.blockId}
                    className="rounded-md border bg-background p-3 text-sm"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-medium">
                        #{index + 1} {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.blockType} · {item.primaryKey}
                      </div>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-2 text-xs text-foreground">
                      {item.displayValue}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                Rust returned no block outputs. This usually means the engine stopped before executing, the block type was not foundation, or the output object is empty.
              </div>
            )}
          </section>

          <section className="space-y-2">
            <div className="text-sm font-semibold">Variables</div>
            <CodeBox value={report.result.variables ?? {}} />
          </section>

          <section className="space-y-2">
            <div className="text-sm font-semibold">Constants</div>
            <CodeBox value={report.result.constants ?? {}} />
          </section>

          {diagnostics.length > 0 ? (
            <section className="space-y-2">
              <div className="text-sm font-semibold">Diagnostics</div>
              <div className="space-y-2">
                {diagnostics.map((diagnostic, index) => (
                  <div key={index} className="rounded-md border bg-background p-3 text-sm">
                    <div className="font-medium">
                      {(diagnostic.severity ?? "info").toUpperCase()}: {diagnostic.message}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      block: {normalizeDiagnosticBlockId(diagnostic) ?? "n/a"}
                      {diagnostic.field ? ` · field: ${diagnostic.field}` : ""}
                    </div>
                    {diagnostic.help ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {diagnostic.help}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Route className="size-4" />
              Execution trace
            </div>
            {trace.length > 0 ? (
              <div className="space-y-2">
                {trace.map((item, index) => (
                  <div key={`${normalizeTraceBlockId(item)}-${index}`} className="rounded-md border bg-background p-3 text-sm">
                    <div className="font-medium">
                      {item.status ?? "planned"}: {item.summary ?? "No summary."}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {normalizeTraceBlockId(item)} · {normalizeTraceBlockType(item)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                No execution trace returned.
              </div>
            )}
          </section>

          {report.skippedBlocks.length > 0 ? (
            <section className="space-y-2">
              <div className="text-sm font-semibold">Skipped non-foundation blocks</div>
              <div className="space-y-2">
                {report.skippedBlocks.map((block) => (
                  <div key={block.id} className="rounded-md border bg-background p-3 text-sm">
                    <div className="font-medium">{block.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {block.type} · {block.reason}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <details className="rounded-md border bg-background p-3">
            <summary className="cursor-pointer text-sm font-semibold">
              Raw Rust Result
            </summary>
            <div className="mt-3">
              <CodeBox value={report.result} />
            </div>
          </details>

          <details className="rounded-md border bg-background p-3">
            <summary className="cursor-pointer text-sm font-semibold">
              Sent Payload
            </summary>
            <div className="mt-3">
              <CodeBox value={report.payload} />
            </div>
          </details>
        </CardContent>
      ) : null}
    </Card>
  );
}
