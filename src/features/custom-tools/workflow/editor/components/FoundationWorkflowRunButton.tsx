import { GitBranch, Loader2, Play, Route } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import type { CustomToolBlock } from "../../../domain/customToolTypes";
import {
  createFoundationWorkflowExecutionPlan,
  partitionFoundationWorkflowBlocks,
  runFoundationWorkflowFromBlocks,
  toFoundationRunErrorMessage,
  type FoundationWorkflowConnectionLike,
  type FoundationWorkflowRunReport,
} from "../../../runtime/foundationWorkflowRuntime";
import { FoundationWorkflowRunPanel } from "./FoundationWorkflowRunPanel";

type FoundationWorkflowRunButtonProps = {
  blocks: CustomToolBlock[];
  connections?: FoundationWorkflowConnectionLike[];
  isRunning?: boolean;
  onRunStart?: () => void;
  onRunComplete?: (report: FoundationWorkflowRunReport) => void;
  onRunError?: (message: string) => void;
  showInlineReport?: boolean;
};

export function FoundationWorkflowRunButton({
  blocks,
  connections = [],
  isRunning,
  onRunStart,
  onRunComplete,
  onRunError,
  showInlineReport = true,
}: FoundationWorkflowRunButtonProps) {
  const [localIsRunning, setLocalIsRunning] = useState(false);
  const [localReport, setLocalReport] =
    useState<FoundationWorkflowRunReport | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [inlineReportOpen, setInlineReportOpen] = useState(false);

  const { foundationBlocks, skippedBlocks } = useMemo(
    () => partitionFoundationWorkflowBlocks(blocks),
    [blocks],
  );

  const executionPlan = useMemo(
    () => createFoundationWorkflowExecutionPlan(blocks, connections),
    [blocks, connections],
  );

  const effectiveIsRunning = isRunning ?? localIsRunning;
  const canRun = foundationBlocks.length > 0 && !effectiveIsRunning;

  const runWorkflow = async () => {
    if (!canRun) return;

    setInlineReportOpen(true);
    setLocalError(null);
    setLocalIsRunning(true);
    onRunStart?.();

    try {
      const report = await runFoundationWorkflowFromBlocks(
        blocks,
        undefined,
        connections,
      );
      setLocalReport(report);
      setLocalError(null);
      setLocalIsRunning(false);
      setInlineReportOpen(true);
      onRunComplete?.(report);
    } catch (error) {
      const message = toFoundationRunErrorMessage(error);
      setLocalError(message);
      setLocalIsRunning(false);
      setInlineReportOpen(true);
      onRunError?.(message);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
        <Button
          type="button"
          onClick={runWorkflow}
          disabled={!canRun}
          title={
            foundationBlocks.length === 0
              ? "Add foundation blocks before running the Rust foundation workflow."
              : executionPlan.hasArrowOrder
                ? "Run foundation blocks through Rust using the canvas arrow dependency order."
                : "Run foundation blocks through Rust in current workflow block order."
          }
        >
          {effectiveIsRunning ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : executionPlan.hasArrowOrder ? (
            <GitBranch className="mr-2 size-4" />
          ) : (
            <Play className="mr-2 size-4" />
          )}
          Run Rust Workflow
        </Button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Route className="size-3.5" />
          <span>
            {foundationBlocks.length} foundation block
            {foundationBlocks.length === 1 ? "" : "s"}
          </span>
          <span>
            · {executionPlan.hasArrowOrder ? "arrow order" : "block order"}
          </span>
          {executionPlan.edges.length > 0 ? (
            <span>
              · {executionPlan.edges.length} foundation arrow
              {executionPlan.edges.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {executionPlan.hasCycle ? <span>· cycle fallback active</span> : null}
          {skippedBlocks.length > 0 ? (
            <span>
              · {skippedBlocks.length} non-foundation block
              {skippedBlocks.length === 1 ? "" : "s"} skipped
            </span>
          ) : null}
        </div>
      </div>

      {showInlineReport ? (
        <FoundationWorkflowRunPanel
          open={inlineReportOpen}
          isRunning={effectiveIsRunning}
          report={localReport}
          error={localError}
          onClose={() => setInlineReportOpen(false)}
        />
      ) : null}
    </div>
  );
}
