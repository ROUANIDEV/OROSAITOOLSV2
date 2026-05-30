import { GitBranch, Loader2, Play, Route, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { TestRunInputField } from "../../../runtime/components/TestRunInputField";
import {
  createCanvasInputTestValuesFromBlocks,
  deriveCanvasInputsFromBlocks,
  type UnknownRecord,
} from "../../io/canvasWorkflowIo";
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

type RunInputValue = string | number | boolean;

type RunInputValues = Record<string, RunInputValue>;

function toRunInputValues(value: UnknownRecord): RunInputValues {
  const result: RunInputValues = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      result[key] = item;
    }
  }
  return result;
}

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
  const [localReport, setLocalReport] = useState<FoundationWorkflowRunReport | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [inlineReportOpen, setInlineReportOpen] = useState(false);
  const [valuePanelOpen, setValuePanelOpen] = useState(false);
  const [inputValues, setInputValues] = useState<RunInputValues>({});

  const { foundationBlocks, skippedBlocks } = useMemo(
    () => partitionFoundationWorkflowBlocks(blocks),
    [blocks],
  );
  const executionPlan = useMemo(
    () => createFoundationWorkflowExecutionPlan(blocks, connections),
    [blocks, connections],
  );
  const canvasInputs = useMemo(() => deriveCanvasInputsFromBlocks(blocks), [blocks]);
  const mergedInputValues = useMemo(
    () =>
      toRunInputValues(
        createCanvasInputTestValuesFromBlocks(blocks, inputValues),
      ),
    [blocks, inputValues],
  );

  useEffect(() => {
    setInputValues((currentValues) =>
      toRunInputValues(
        createCanvasInputTestValuesFromBlocks(blocks, currentValues),
      ),
    );
  }, [blocks]);

  const effectiveIsRunning = isRunning ?? localIsRunning;
  const canRun = foundationBlocks.length > 0 && !effectiveIsRunning;

  const updateInputValue = (inputId: string, value: RunInputValue) => {
    setInputValues((currentValues) => ({
      ...currentValues,
      [inputId]: value,
    }));
  };

  const executeWorkflow = async () => {
    if (!canRun) return;

    setInlineReportOpen(true);
    setValuePanelOpen(false);
    setLocalError(null);
    setLocalIsRunning(true);
    onRunStart?.();

    try {
      const report = await runFoundationWorkflowFromBlocks(
        blocks,
        undefined,
        connections,
        mergedInputValues,
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

  const runWorkflow = () => {
    if (!canRun) return;

    if (canvasInputs.length > 0 && !valuePanelOpen) {
      setValuePanelOpen(true);
      setInlineReportOpen(false);
      return;
    }

    void executeWorkflow();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={runWorkflow} disabled={!canRun}>
          {effectiveIsRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : executionPlan.hasArrowOrder ? (
            <GitBranch className="mr-2 h-4 w-4" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Rust Workflow
        </Button>

        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Route className="h-4 w-4" />
          {foundationBlocks.length} foundation block
          {foundationBlocks.length === 1 ? "" : "s"} ·{" "}
          {executionPlan.hasArrowOrder ? "arrow order" : "block order"}
          {executionPlan.edges.length > 0 ? (
            <>
              {" "}· {executionPlan.edges.length} foundation arrow
              {executionPlan.edges.length === 1 ? "" : "s"}
            </>
          ) : null}
          {executionPlan.hasCycle ? " · cycle fallback active" : null}
          {skippedBlocks.length > 0 ? (
            <>
              {" "}· {skippedBlocks.length} non-foundation block
              {skippedBlocks.length === 1 ? "" : "s"} skipped
            </>
          ) : null}
        </span>
      </div>

      {valuePanelOpen ? (
        <div className="rounded-3xl border bg-card/80 p-4 shadow-lg">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Enter values for this Rust run</p>
              <p className="text-sm text-muted-foreground">
                These fields come from Input blocks on the canvas. The values are sent to Rust before the workflow starts.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setValuePanelOpen(false)}
              disabled={effectiveIsRunning}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {canvasInputs.map((input) => (
              <TestRunInputField
                key={input.id}
                input={input}
                value={mergedInputValues[input.id]}
                onValueChange={(value) => updateInputValue(input.id, value)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={executeWorkflow} disabled={!canRun}>
              {effectiveIsRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {effectiveIsRunning ? "Running..." : "Proceed run"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setValuePanelOpen(false)}
              disabled={effectiveIsRunning}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

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
