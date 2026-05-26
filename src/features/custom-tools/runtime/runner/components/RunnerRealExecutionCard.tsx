import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomToolManifest } from "@/features/custom-tools/domain/customToolTypes";
import { runCustomToolExecution } from "../../execution";
import { TestInputValues } from "../../state";
import { TestRunAppendPreviews, TestRunBlockOutputs, TestRunExecutionPlan, TestRunLogs } from "../../components";
import { addCustomToolRunHistoryEntry, createCustomToolRunErrorLog, createCustomToolRunHistoryEntry } from "../../../registry/history";


type ExecutionResult = Awaited<ReturnType<typeof runCustomToolExecution>>;

type RunnerRealExecutionCardProps = {
  tool: CustomToolManifest;
  values: TestInputValues;
  onHistoryChange?: () => void;
};

export function RunnerRealExecutionCard({
  tool,
  values,
  onHistoryChange,
}: RunnerRealExecutionCardProps) {
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const hasAppendBlocks = useMemo(() => {
    return tool.workflow.blocks.some((block) => block.type === "file.appendText");
  }, [tool]);

  const hasPythonBlocks = useMemo(() => {
    return tool.workflow.blocks.some((block) => block.type === "python.code");
  }, [tool]);

  const permissionBlocked =
    (hasAppendBlocks && !tool.permissions.fileWrite) ||
    (hasPythonBlocks && !tool.permissions.python);

  const confirmationBlocked =
    hasAppendBlocks && confirmation.trim() !== "APPEND";

  const canExecute = !permissionBlocked && !confirmationBlocked && !isRunning;

  const runExecution = async () => {
    setError("");
    setIsRunning(true);

    try {
      const nextResult = await runCustomToolExecution(tool, values, confirmation);
      setResult(nextResult);

      await addCustomToolRunHistoryEntry(
        createCustomToolRunHistoryEntry({
          tool,
          runKind: "confirmed",
          succeeded: nextResult.succeeded,
          logs: nextResult.logs,
          outputByBlockId: nextResult.outputByBlockId,
          appendPreviews: nextResult.appendPreviews,
          bytesAppended: nextResult.bytesAppended,
        }),
      );

      onHistoryChange?.();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Confirmed execution failed unexpectedly.";

      setResult(null);
      setError(message);

      await addCustomToolRunHistoryEntry(
        createCustomToolRunHistoryEntry({
          tool,
          runKind: "confirmed",
          succeeded: false,
          logs: [createCustomToolRunErrorLog(message)],
          outputByBlockId: {},
          errorMessage: message,
        }),
      );

      onHistoryChange?.();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmed workflow execution</CardTitle>
        <CardDescription>
          Runs permitted blocks and shows structured outputs from the workflow.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasAppendBlocks && !tool.permissions.fileWrite ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            This tool needs fileWrite permission for append blocks.
          </div>
        ) : null}

        {hasPythonBlocks && !tool.permissions.python ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            This tool needs python permission for Python blocks.
          </div>
        ) : null}

        {hasAppendBlocks ? (
          <label className="block space-y-2 text-sm">
            <span className="font-medium">File-write confirmation</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Type APPEND"
              disabled={isRunning}
            />
          </label>
        ) : null}

        <Button onClick={runExecution} disabled={!canExecute}>
          {isRunning ? "Running..." : "Run confirmed workflow"}
        </Button>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <TestRunExecutionPlan plan={result.executionPlan} />
            <TestRunLogs logs={result.logs} />
            <TestRunBlockOutputs outputs={result.outputByBlockId} />
            <TestRunAppendPreviews previews={result.appendPreviews} />

            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="font-medium">Bytes appended:</span>{" "}
              {result.bytesAppended}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}