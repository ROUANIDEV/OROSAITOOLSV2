import { ArrowRight, CheckCircle2, Link2, Link2Off } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { FoundationArrowInputSuggestion } from "../../../runtime/foundationWorkflowRuntime";

type FoundationLinkedInputsPanelProps = {
  suggestions: FoundationArrowInputSuggestion[];
  onApply?: (connectionId: string) => void;
  onRemove?: (connectionId: string) => void;
};

function previewText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (typeof value === "undefined") return "No preview value yet";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function FoundationLinkedInputsPanel({
  suggestions,
  onApply,
  onRemove,
}: FoundationLinkedInputsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 className="size-4 text-primary" />
            Connected outputs available for this block
          </div>
          <p className="text-xs text-muted-foreground">
            These values appear here only because arrows enter this block. No arrow means no linked data is offered.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.connectionId}
            className="rounded-xl border bg-background/85 p-3 shadow-sm"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">
                    {suggestion.sourceLabel}
                  </span>
                  <ArrowRight className="size-4 text-primary" />
                  <span className="text-muted-foreground">this block</span>
                  {suggestion.isApplied ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      used
                    </span>
                  ) : (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      not used yet
                    </span>
                  )}
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Output name
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-foreground">
                      {suggestion.sourceName}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Token to insert
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-primary">
                      {suggestion.token}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Target input
                    </p>
                    <p className="mt-1 break-all text-xs text-foreground">
                      {suggestion.targetFieldLabel}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Current output value from source block
                  </p>
                  <p className="mb-2 text-xs font-medium text-foreground">
                    {suggestion.sourceOutputLabel}
                  </p>
                  <pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded-md bg-background/80 p-2 font-mono text-xs text-foreground">
                    {suggestion.sourceOutputDisplayValue || previewText(suggestion.sourceOutputValue)}
                  </pre>
                </div>

                {suggestion.isApplied ? (
                  <p className="text-xs text-muted-foreground">
                    This output is currently inserted into <span className="font-medium text-foreground">{suggestion.targetFieldLabel}</span>.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Click <span className="font-medium text-foreground">Use this output</span> to insert {suggestion.token} into <span className="font-medium text-foreground">{suggestion.targetFieldLabel}</span>.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-row gap-2 lg:flex-col">
                <Button
                  type="button"
                  size="sm"
                  disabled={suggestion.isApplied || !onApply}
                  onClick={() => onApply?.(suggestion.connectionId)}
                >
                  Use this output
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!suggestion.isApplied || !onRemove}
                  onClick={() => onRemove?.(suggestion.connectionId)}
                >
                  <Link2Off className="mr-1.5 size-3.5" />
                  Do not use
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
