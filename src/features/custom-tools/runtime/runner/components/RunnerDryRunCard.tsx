import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomToolManifest } from "@/features/custom-tools/domain/customToolTypes";
import { RunnerRealExecutionCard } from "./RunnerRealExecutionCard";
import { runCustomToolDryRun } from "../../dry-run/runCustomToolDryRun";
import { TestInputValues } from "../../state/testRunTypes";
import { TestRunExecutionPlan } from "../../components/TestRunExecutionPlan";
import { TestRunLogs } from "../../components/TestRunLogs";
import { TestRunBlockOutputs } from "../../components/TestRunBlockOutputs";
import { TestRunAppendPreviews } from "../../components/TestRunAppendPreviews";
import { addCustomToolRunHistoryEntry, createCustomToolRunErrorLog, createCustomToolRunHistoryEntry } from "../../../registry/history";

type DryRunResult = Awaited<ReturnType<typeof runCustomToolDryRun>>;

type RunnerDryRunCardProps = {
  tool: CustomToolManifest;
  values: TestInputValues;
  onHistoryChange?: () => void;
};

export function RunnerDryRunCard({
  tool,
  values,
  onHistoryChange,
}: RunnerDryRunCardProps) {
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const runDryRun = async () => {
    setError("");
    setIsRunning(true);

    try {
      const nextResult = await runCustomToolDryRun(tool, values);
      setResult(nextResult);

      await addCustomToolRunHistoryEntry(
        createCustomToolRunHistoryEntry({
          tool,
          runKind: "dry-run",
          succeeded: nextResult.succeeded,
          logs: nextResult.logs,
          outputByBlockId: nextResult.outputByBlockId,
          appendPreviews: nextResult.appendPreviews,
        }),
      );

      onHistoryChange?.();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The dry run failed unexpectedly.";

      setResult(null);
      setError(message);

      await addCustomToolRunHistoryEntry(
        createCustomToolRunHistoryEntry({
          tool,
          runKind: "dry-run",
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dry-run execution</CardTitle>
          <CardDescription>
            Simulate this published tool without writing files and inspect block outputs.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button onClick={runDryRun} disabled={isRunning}>
            {isRunning ? "Running dry run..." : "Run dry run"}
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
            </div>
          ) : null}
        </CardContent>
      </Card>

      <RunnerRealExecutionCard
        tool={tool}
        values={values}
        onHistoryChange={onHistoryChange}
      />
    </div>
  );
}