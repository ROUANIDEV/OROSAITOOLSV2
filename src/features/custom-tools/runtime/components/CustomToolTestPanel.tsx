import { useMemo, useState, type SetStateAction } from "react";
import { Cpu, PlayCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { markCustomToolDraftTested } from "../../domain/customToolDraftLifecycle";
import type { CustomToolManifest, CustomToolOutput } from "../../domain/customToolTypes";
import { validateCustomToolDraft } from "../../domain/validation/rules/customToolValidation";
import {
  createCanvasInputTestValues,
  syncCanvasIoToManifest,
} from "../../workflow/io/canvasWorkflowIo";
import { createTestRunLog } from "../dry-run/dryRunLogs";
import { runCustomToolDryRun } from "../dry-run/runCustomToolDryRun";
import {
  createFoundationWorkflowRunPayload,
  runFoundationWorkflowFromBlocks,
  toFoundationRunErrorMessage,
} from "../foundationWorkflowRuntime";
import { TestRunBlockOutputs } from "./TestRunBlockOutputs";
import { TestRunInputField } from "./TestRunInputField";
import { TestRunLogs } from "./TestRunLogs";
import type {
  TestInputValues,
  TestRunAppendPreview,
  TestRunExecutionPlanItem,
  TestRunLog,
} from "../state/testRunTypes";

export type CustomToolTestPanelSession = {
  values: TestInputValues;
  logs: TestRunLog[];
  previews: TestRunAppendPreview[];
  executionPlan: TestRunExecutionPlanItem[];
  outputs: Record<string, unknown>;
};

type CustomToolTestPanelProps = {
  draft: CustomToolManifest;
  session?: CustomToolTestPanelSession;
  onSessionChange?: (session: CustomToolTestPanelSession) => void;
  onDraftChange: (draft: CustomToolManifest) => void;
};

function createExecutionPlan(blocks: Array<{ id: string; label: string; type: string }>) {
  return blocks.map((block, index) => ({
    blockId: block.id,
    blockLabel: block.label,
    blockType: block.type,
    stepIndex: index + 1,
  }));
}

function createDefaultTestPanelSession(
  draft: CustomToolManifest,
): CustomToolTestPanelSession {
  return {
    values: createCanvasInputTestValues(draft),
    logs: [],
    previews: [],
    executionPlan: [],
    outputs: {},
  };
}

function normalizeTestPanelSession(
  draft: CustomToolManifest,
  session?: CustomToolTestPanelSession,
): CustomToolTestPanelSession {
  const defaults = createDefaultTestPanelSession(draft);
  if (!session) return defaults;

  return {
    ...defaults,
    ...session,
    values: {
      ...defaults.values,
      ...session.values,
    },
    logs: Array.isArray(session.logs) ? session.logs : [],
    previews: Array.isArray(session.previews) ? session.previews : [],
    executionPlan: Array.isArray(session.executionPlan) ? session.executionPlan : [],
    outputs:
      session.outputs && typeof session.outputs === "object"
        ? session.outputs
        : {},
  };
}

function resolveStateAction<T>(action: SetStateAction<T>, currentValue: T): T {
  if (typeof action === "function") {
    return (action as (value: T) => T)(currentValue);
  }
  return action;
}

function normalizeOutputs(outputs: unknown) {
  return outputs && typeof outputs === "object" && !Array.isArray(outputs)
    ? (outputs as Record<string, unknown>)
    : {};
}

function getUserOutputValues(
  rawOutputs: unknown,
  outputFields: CustomToolOutput[] = [],
) {
  const outputs = normalizeOutputs(rawOutputs);
  if (outputFields.length === 0) return outputs;

  const userOutputs: Record<string, unknown> = {};
  for (const output of outputFields) {
    if (Object.prototype.hasOwnProperty.call(outputs, output.id)) {
      userOutputs[output.id] = outputs[output.id];
    }
  }
  return userOutputs;
}

export function CustomToolTestPanel({
  draft,
  session,
  onSessionChange,
  onDraftChange,
}: CustomToolTestPanelProps) {
  const syncedDraft = useMemo(() => syncCanvasIoToManifest(draft), [draft]);
  const validation = validateCustomToolDraft(syncedDraft);
  const [localSession, setLocalSession] = useState(() =>
    createDefaultTestPanelSession(syncedDraft),
  );
  const [rustValuePanelOpen, setRustValuePanelOpen] = useState(false);
  const currentSession = normalizeTestPanelSession(
    syncedDraft,
    session ?? localSession,
  );

  const commitSession = (action: SetStateAction<CustomToolTestPanelSession>) => {
    const nextSession = resolveStateAction(action, currentSession);
    if (onSessionChange) {
      onSessionChange(nextSession);
      return;
    }
    setLocalSession(nextSession);
  };

  const inputValues = useMemo(
    () => createCanvasInputTestValues(syncedDraft, currentSession.values),
    [syncedDraft, currentSession.values],
  );

  const [isRunningRust, setIsRunningRust] = useState(false);
  const [isRunningDryRun, setIsRunningDryRun] = useState(false);

  const updateValue = (inputId: string, value: TestInputValues[string]) => {
    commitSession((currentValue) => ({
      ...currentValue,
      values: {
        ...currentValue.values,
        [inputId]: value,
      },
    }));
  };

  const executeRustWorkflow = async () => {
    if (isRunningRust || syncedDraft.workflow.blocks.length === 0) return;

    setIsRunningRust(true);
    try {
      const visualConnections = syncedDraft.workflow.visualConnections ?? [];
      const payloadPreview = createFoundationWorkflowRunPayload(
        syncedDraft.workflow.blocks,
        {
          dryRun: false,
          failFast: false,
          maxLoopIterations: 1_000,
        },
        visualConnections,
        inputValues,
      );
      const report = await runFoundationWorkflowFromBlocks(
        syncedDraft.workflow.blocks,
        {
          dryRun: false,
          failFast: false,
          maxLoopIterations: 1_000,
        },
        visualConnections,
        inputValues,
      );

      const diagnostics = report.result.diagnostics ?? [];
      const logs: TestRunLog[] = [
        ...(report.skippedBlocks.length > 0
          ? report.skippedBlocks.map((block) =>
              createTestRunLog("warning", `${block.label}: ${block.reason}`),
            )
          : []),
        ...diagnostics.map((diagnostic) => {
          const level =
            diagnostic.severity === "error"
              ? "error"
              : diagnostic.severity === "warning"
                ? "warning"
                : "info";
          return createTestRunLog(
            level,
            diagnostic.message ?? "Workflow runtime diagnostic.",
          );
        }),
        report.result.ok === true
          ? createTestRunLog("success", "Rust workflow completed successfully.")
          : createTestRunLog("error", "Rust workflow finished with errors."),
      ];

      commitSession((currentValue) => ({
        ...currentValue,
        logs,
        previews: [],
        executionPlan: createExecutionPlan(payloadPreview.foundationBlocks),
        outputs: getUserOutputValues(report.result.outputs, syncedDraft.outputs),
      }));
      setRustValuePanelOpen(false);
      onDraftChange(syncedDraft);
    } catch (error) {
      commitSession((currentValue) => ({
        ...currentValue,
        logs: [
          createTestRunLog(
            "error",
            `Run Rust Workflow failed: ${toFoundationRunErrorMessage(error)}`,
          ),
        ],
        previews: [],
        executionPlan: [],
        outputs: {},
      }));
    } finally {
      setIsRunningRust(false);
    }
  };

  const startRustWorkflow = () => {
    if (syncedDraft.inputs.length > 0 && !rustValuePanelOpen) {
      setRustValuePanelOpen(true);
      return;
    }
    void executeRustWorkflow();
  };

  const runDryTest = async () => {
    if (!validation.canPublish || isRunningDryRun) return;

    setIsRunningDryRun(true);
    try {
      const result = await runCustomToolDryRun(syncedDraft, inputValues);
      commitSession((currentValue) => ({
        ...currentValue,
        logs: result.logs,
        previews: result.appendPreviews,
        executionPlan: result.executionPlan ?? [],
        outputs: result.outputByBlockId,
      }));

      if (result.succeeded) {
        onDraftChange(markCustomToolDraftTested(syncedDraft));
      }
    } catch (error) {
      commitSession((currentValue) => ({
        ...currentValue,
        logs: [
          createTestRunLog(
            "error",
            error instanceof Error ? error.message : "Dry run failed unexpectedly.",
          ),
        ],
        previews: [],
        executionPlan: [],
        outputs: {},
      }));
    } finally {
      setIsRunningDryRun(false);
    }
  };

  const isBusy = isRunningRust || isRunningDryRun;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test workflow</CardTitle>
        <CardDescription>
          First run the Rust workflow with real input values. After it passes,
          run the dry test before publishing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rustValuePanelOpen ? (
          <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Values for this Rust run</h3>
                <p className="text-sm text-muted-foreground">
                  These fields come from the Input blocks on your canvas.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRustValuePanelOpen(false)}
                disabled={isBusy}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {syncedDraft.inputs.map((input) => (
                <TestRunInputField
                  key={input.id}
                  input={input}
                  value={inputValues[input.id]}
                  onValueChange={(value) => updateValue(input.id, value)}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={executeRustWorkflow}
                disabled={isBusy || syncedDraft.workflow.blocks.length === 0}
              >
                <Cpu className="mr-2 h-4 w-4" />
                {isRunningRust ? "Running..." : "Proceed run"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRustValuePanelOpen(false)}
                disabled={isBusy}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {syncedDraft.inputs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground">
            Add an Input block on the Canvas when the workflow needs a user value.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={startRustWorkflow}
            disabled={isBusy || syncedDraft.workflow.blocks.length === 0}
          >
            <Cpu className="mr-2 h-4 w-4" />
            {isRunningRust ? "Running Rust workflow..." : "Run Rust Workflow"}
          </Button>
          <Button
            type="button"
            onClick={runDryTest}
            disabled={isBusy || !validation.canPublish}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {isRunningDryRun ? "Running dry test..." : "Run dry test"}
          </Button>
        </div>

        {!validation.canPublish ? (
          <p className="text-sm text-muted-foreground">
            Fix validation errors before running a dry test. You can still use
            Run Rust Workflow while building foundation blocks.
          </p>
        ) : null}

        {syncedDraft.status === "tested" || syncedDraft.status === "published" ? (
          <p className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-300">
            This workflow has a successful dry test. You can publish it from the
            Publish tab.
          </p>
        ) : null}

        <TestRunBlockOutputs
          outputs={currentSession.outputs}
          blocks={syncedDraft.workflow.blocks}
        />
        <TestRunLogs logs={currentSession.logs} />
      </CardContent>
    </Card>
  );
}
