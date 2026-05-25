import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomToolManifest } from "@/features/custom-tools/model/customToolTypes";
import { runCustomToolDryRun } from "@/features/custom-tools/testRun/runCustomToolDryRun";
import { TestRunAppendPreviews } from "@/features/custom-tools/testRun/TestRunAppendPreviews";
import { TestRunBlockOutputs } from "@/features/custom-tools/testRun/TestRunBlockOutputs";
import { TestRunLogs } from "@/features/custom-tools/testRun/TestRunLogs";
import type { TestInputValues } from "@/features/custom-tools/testRun/testRunTypes";
import { RunnerRealExecutionCard } from "./RunnerRealExecutionCard";

type DryRunResult = Awaited<ReturnType<typeof runCustomToolDryRun>>;

type RunnerDryRunCardProps = {
  tool: CustomToolManifest;
  values: TestInputValues;
};

export function RunnerDryRunCard({ tool, values }: RunnerDryRunCardProps) {
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const runDryRun = async () => {
    setError("");
    setIsRunning(true);

    try {
      const nextResult = await runCustomToolDryRun(tool, values);
      setResult(nextResult);
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The dry run failed unexpectedly.",
      );
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
            Simulate this published tool without writing files and inspect block
            outputs.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button type="button" onClick={runDryRun} disabled={isRunning}>
            {isRunning ? "Running dry run..." : "Run dry run"}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <>
              <TestRunLogs logs={result.logs} />
              <TestRunAppendPreviews previews={result.appendPreviews} />
              <TestRunBlockOutputs outputs={result.outputByBlockId} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <RunnerRealExecutionCard tool={tool} values={values} />
    </div>
  );
}
