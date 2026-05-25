import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { runCustomToolExecution } from "@/features/custom-tools/execution/runCustomToolExecution";
import {
  createCustomToolRunErrorLog,
  createCustomToolRunHistoryEntry,
} from "@/features/custom-tools/history/createCustomToolRunHistoryEntry";
import { addCustomToolRunHistoryEntry } from "@/features/custom-tools/history/customToolRunHistoryStorage";
import type { CustomToolManifest } from "@/features/custom-tools/model/customToolTypes";
import { TestRunAppendPreviews } from "@/features/custom-tools/testRun/TestRunAppendPreviews";
import { TestRunBlockOutputs } from "@/features/custom-tools/testRun/TestRunBlockOutputs";
import { TestRunLogs } from "@/features/custom-tools/testRun/TestRunLogs";
import type { TestInputValues } from "@/features/custom-tools/testRun/testRunTypes";

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
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Confirmed workflow execution</CardTitle>
        <CardDescription>
          Runs permitted blocks and shows structured outputs from the workflow.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasAppendBlocks && !tool.permissions.fileWrite ? (
          <p className="text-sm text-destructive">
            This tool needs fileWrite permission for append blocks.
          </p>
        ) : null}

        {hasPythonBlocks && !tool.permissions.python ? (
          <p className="text-sm text-destructive">
            This tool needs python permission for Python blocks.
          </p>
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

        <Button
          type="button"
          variant="destructive"
          onClick={runExecution}
          disabled={!canExecute}
        >
          {isRunning ? "Running..." : "Run confirmed workflow"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {result ? (
          <>
            <TestRunLogs logs={result.logs} />
            <TestRunAppendPreviews previews={result.appendPreviews} />
            <TestRunBlockOutputs
              blocks={tool.workflow.blocks}
              outputs={result.outputByBlockId}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}