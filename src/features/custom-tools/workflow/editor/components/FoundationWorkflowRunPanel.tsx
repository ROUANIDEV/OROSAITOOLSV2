import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  ListChecks,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import {
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

type TraceGroup = {
  key: string;
  status: string;
  summary: string;
  blockId: string;
  blockType: string;
  count: number;
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

function statusTone(status: string) {
  if (status === "error") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (status === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "executed") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return "border-muted bg-muted/60 text-muted-foreground";
}

function outputRoleLabel(item: FoundationWorkflowOutputItem) {
  if (item.isWorkflowOutput) return "Workflow result";
  if (item.role === "terminal") return "Terminal value";
  return "Intermediate";
}

function groupTrace(trace: FoundationRuntimeTraceItem[]): TraceGroup[] {
  const groups: TraceGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of trace) {
    const blockId = normalizeTraceBlockId(item);
    const blockType = normalizeTraceBlockType(item);
    const status = item.status ?? "planned";
    const summary = item.summary ?? "Step completed.";
    const key = `${blockId}|${blockType}|${status}|${summary}`;
    const existingIndex = indexByKey.get(key);

    if (typeof existingIndex === "number") {
      groups[existingIndex].count += 1;
      continue;
    }

    indexByKey.set(key, groups.length);
    groups.push({ key, status, summary, blockId, blockType, count: 1 });
  }

  return groups;
}

function blockLabelById(report: FoundationWorkflowRunReport | null, blockId: string) {
  return report?.foundationBlocks.find((block) => block.id === blockId)?.label ?? blockId;
}

function blockById(report: FoundationWorkflowRunReport | null, blockId: string | null) {
  if (!report || !blockId) return null;
  return report.foundationBlocks.find((block) => block.id === blockId) ?? null;
}

function traceShowsExecuted(report: FoundationWorkflowRunReport | null, blockId: string | null) {
  if (!report || !blockId) return false;
  const trace = report.result.trace ?? report.result.steps ?? [];
  return trace.some((item) => normalizeTraceBlockId(item) === blockId && item.status === "executed");
}

function resultHasOutputForBlock(report: FoundationWorkflowRunReport | null, blockId: string | null) {
  if (!report || !blockId) return false;
  const outputs = report.result.outputs;
  return Boolean(outputs && Object.prototype.hasOwnProperty.call(outputs, blockId));
}

function shouldHideResolvedRuntimeDiagnostic(
  diagnostic: FoundationRuntimeDiagnostic,
  report: FoundationWorkflowRunReport | null,
  outputSummary: ReturnType<typeof createFoundationWorkflowOutputSummary> | null,
) {
  const blockId = normalizeDiagnosticBlockId(diagnostic);
  const block = blockById(report, blockId);
  const field = diagnostic.field ?? "";
  if (!block || !blockId) return false;

  if (block.type === "variable.update" && field === "initialValue") {
    return traceShowsExecuted(report, blockId) || resultHasOutputForBlock(report, blockId);
  }

  if (block.type === "io.output" && (field === "value" || field === "expression")) {
    return (
      outputSummary?.workflowOutputs.some((item) => item.blockId === blockId) ||
      resultHasOutputForBlock(report, blockId)
    );
  }

  return false;
}

function filterRuntimeDiagnostics(
  diagnostics: FoundationRuntimeDiagnostic[],
  report: FoundationWorkflowRunReport | null,
  outputSummary: ReturnType<typeof createFoundationWorkflowOutputSummary> | null,
) {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    if (shouldHideResolvedRuntimeDiagnostic(diagnostic, report, outputSummary)) return false;

    const key = [
      normalizeDiagnosticBlockId(diagnostic) ?? "workflow",
      diagnostic.field ?? "field",
      diagnostic.severity ?? "error",
      diagnostic.message ?? "message",
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function MiniStat({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border bg-background/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{String(value ?? 0)}</p>
    </div>
  );
}

function RunningAnimation() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-linear-to-br from-primary/15 via-background to-background p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="absolute inset-0 rounded-2xl border border-primary/30 animate-ping" />
          </span>
          <div>
            <p className="font-semibold">Running your workflow</p>
            <p className="text-sm text-muted-foreground">
              Rust is moving through the connected blocks.
            </p>
          </div>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}

function OutputCard({ item, index }: { item: FoundationWorkflowOutputItem; index: number }) {
  return (
    <article
      className={[
        "rounded-3xl border p-4 shadow-sm",
        item.isWorkflowOutput
          ? "border-primary/35 bg-primary/10"
          : "border-muted bg-background/70",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            #{index + 1} {item.label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.blockType} · {item.primaryKey}
          </p>
        </div>
        <span
          className={[
            "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
            item.isWorkflowOutput
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {outputRoleLabel(item)}
        </span>
      </div>
      <div className="mt-3 rounded-2xl bg-background/80 px-4 py-3 text-2xl font-semibold">
        {item.displayValue}
      </div>
    </article>
  );
}

function DiagnosticCard({
  diagnostic,
  report,
}: {
  diagnostic: FoundationRuntimeDiagnostic;
  report: FoundationWorkflowRunReport | null;
}) {
  const blockId = normalizeDiagnosticBlockId(diagnostic);
  return (
    <article className="rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
          {diagnostic.severity ?? "error"}
        </span>
        {blockId ? (
          <span className="text-xs text-muted-foreground">
            {blockLabelById(report, blockId)}
          </span>
        ) : null}
        {diagnostic.field ? (
          <code className="rounded-md bg-background/70 px-2 py-0.5 text-[11px]">
            {diagnostic.field}
          </code>
        ) : null}
      </div>
      <p className="mt-2 font-semibold">{diagnostic.message ?? "The block needs setup."}</p>
      {diagnostic.help ? (
        <p className="mt-1 text-xs text-muted-foreground">{diagnostic.help}</p>
      ) : null}
    </article>
  );
}

function EdgePill({ edge }: { edge: FoundationWorkflowExecutionEdge }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground">
      <span className="truncate font-medium text-foreground">{edge.fromLabel}</span>
      <span className="text-muted-foreground">{edge.fromPortId || "output"}</span>
      <span>→</span>
      <span className="truncate font-medium text-foreground">{edge.toLabel}</span>
      <span className="text-muted-foreground">{edge.toPortId || "input"}</span>
    </span>
  );
}

function CompactTrace({
  groups,
  report,
}: {
  groups: TraceGroup[];
  report: FoundationWorkflowRunReport | null;
}) {
  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border bg-background/70 p-3 text-sm text-muted-foreground">
        No execution steps were returned.
      </p>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {groups.slice(0, 12).map((group) => (
        <article
          key={group.key}
          className={["rounded-2xl border p-3 text-sm", statusTone(group.status)].join(" ")}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{blockLabelById(report, group.blockId)}</span>
            {group.count > 1 ? (
              <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold">
                × {group.count}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs opacity-90">{group.summary}</p>
        </article>
      ))}
      {groups.length > 12 ? (
        <p className="rounded-2xl border bg-background/70 p-3 text-sm text-muted-foreground">
          {groups.length - 12} more grouped step{groups.length - 12 === 1 ? "" : "s"} hidden.
        </p>
      ) : null}
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
  const outputSummary = useMemo(
    () => (report ? createFoundationWorkflowOutputSummary(report) : null),
    [report],
  );
  const trace = report?.result.trace ?? report?.result.steps ?? [];
  const traceGroups = useMemo(() => groupTrace(trace), [trace]);
  const rawDiagnostics = report?.result.diagnostics ?? [];
  const diagnostics = useMemo(
    () => filterRuntimeDiagnostics(rawDiagnostics, report, outputSummary),
    [rawDiagnostics, report, outputSummary],
  );
  const executedCount = report?.result.executedCount ?? report?.result.executed_count ?? 0;
  const plannedCount = report?.result.plannedCount ?? report?.result.planned_count ?? 0;
  const warningCount = diagnostics.filter((item) => item.severity === "warning").length;
  const errorCount = diagnostics.filter((item) => item.severity !== "warning").length;
  const workflowOutputs = outputSummary?.workflowOutputs ?? [];
  const intermediateOutputs = outputSummary?.intermediateOutputs ?? [];
  const ok = Boolean(report) && errorCount === 0 && (Boolean(report?.result.ok) || workflowOutputs.length > 0);
  const executionEdges = report?.executionPlan.edges ?? [];

  if (!open && !isRunning && !report && !error) return null;

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
    <section className="rounded-3xl border bg-card/70 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Rust Workflow Run</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            A simple run summary. Repeated loop steps are grouped so the result stays readable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {report ? (
            <Button type="button" variant="outline" size="sm" onClick={copyReport}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy report"}
            </Button>
          ) : null}
          {onClose ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="mr-2 h-3.5 w-3.5" />
              Hide
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {isRunning ? <RunningAnimation /> : null}

        {error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Rust workflow run failed
            </div>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        {report ? (
          <>
            <div
              className={[
                "rounded-3xl border p-4",
                ok
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-destructive/30 bg-destructive/10",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {ok ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {ok ? "Workflow completed" : "Workflow needs attention"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ok
                        ? "Rust executed the connected model successfully."
                        : "Open the setup of the blocks listed below to fix the remaining issue."}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-semibold">
                  {ok ? "ready for dry run" : "not ready yet"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Executed" value={executedCount} />
              <MiniStat label="Waiting" value={plannedCount} />
              <MiniStat label="Errors" value={errorCount} />
              <MiniStat label="Warnings" value={warningCount} />
            </div>

            <div className="rounded-3xl border bg-background/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Result</h3>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {workflowOutputs.length || intermediateOutputs.length} value{workflowOutputs.length + intermediateOutputs.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {workflowOutputs.length > 0 ? (
                  workflowOutputs.map((item, index) => (
                    <OutputCard key={`${item.blockId}-${item.primaryKey}`} item={item} index={index} />
                  ))
                ) : (
                  <p className="rounded-2xl border bg-background/70 p-3 text-sm text-muted-foreground">
                    No Output block produced a value yet. Check the block setup section below.
                  </p>
                )}
              </div>
            </div>

            {diagnostics.length > 0 ? (
              <div className="rounded-3xl border bg-background/55 p-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold">Things to fix</h3>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {diagnostics.slice(0, 8).map((diagnostic, index) => (
                    <DiagnosticCard
                      key={`${normalizeDiagnosticBlockId(diagnostic) ?? "diagnostic"}-${diagnostic.field ?? index}`}
                      diagnostic={diagnostic}
                      report={report}
                    />
                  ))}
                </div>
                {diagnostics.length > 8 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {diagnostics.length - 8} more issue{diagnostics.length - 8 === 1 ? "" : "s"} hidden in the raw report.
                  </p>
                ) : null}
              </div>
            ) : null}

            <details className="rounded-3xl border bg-background/55 p-4" open={false}>
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
                <Route className="h-4 w-4 text-primary" />
                Connection route
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {executionEdges.length > 0 ? (
                  executionEdges.map((edge) => <EdgePill key={edge.id} edge={edge} />)
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No model arrows were used for ordering.
                  </p>
                )}
              </div>
            </details>

            <details className="rounded-3xl border bg-background/55 p-4" open={false}>
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Compact execution trace
              </summary>
              <div className="mt-3">
                <CompactTrace groups={traceGroups} report={report} />
              </div>
            </details>

            <details className="rounded-3xl border bg-background/55 p-4" open={false}>
              <summary className="cursor-pointer list-none font-semibold">Raw Rust Result</summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-black/80 p-3 text-xs text-white">
                {stringifyJson(report.result)}
              </pre>
            </details>

            <details className="rounded-3xl border bg-background/55 p-4" open={false}>
              <summary className="cursor-pointer list-none font-semibold">Sent Payload</summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-black/80 p-3 text-xs text-white">
                {stringifyJson(report.payload)}
              </pre>
            </details>
          </>
        ) : null}
      </div>
    </section>
  );
}
