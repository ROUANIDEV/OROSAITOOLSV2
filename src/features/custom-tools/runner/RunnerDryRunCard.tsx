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
import { TestRunLogs } from "@/features/custom-tools/testRun/TestRunLogs";
import type { TestInputValues } from "@/features/custom-tools/testRun/testRunTypes";

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
    <Card>
      <CardHeader>
        <CardTitle>Dry-run execution</CardTitle>
        <CardDescription>
          Simulate this published tool without reading or writing real files.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button type="button" onClick={runDryRun} disabled={isRunning}>
          {isRunning ? "Running dry run..." : "Run dry run"}
        </Button>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {result ? <TestRunLogs logs={result.logs} /> : null}
      </CardContent>
    </Card>
  );
}