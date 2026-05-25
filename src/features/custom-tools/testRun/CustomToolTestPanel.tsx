import { useMemo, useState } from "react";
import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { markCustomToolDraftTested } from "../model/customToolDraftLifecycle";
import type { CustomToolManifest } from "../model/customToolTypes";
import { validateCustomToolDraft } from "../validation/customToolValidation";
import { createInitialTestValues } from "./createInitialTestValues";
import { createTestRunLog } from "./dryRunLogs";
import { runCustomToolDryRun } from "./runCustomToolDryRun";
import { TestRunAppendPreviews } from "./TestRunAppendPreviews";
import { TestRunBlockOutputs } from "./TestRunBlockOutputs";
import { TestRunInputField } from "./TestRunInputField";
import { TestRunLogs } from "./TestRunLogs";
import type {
  TestInputValues,
  TestRunAppendPreview,
  TestRunLog,
} from "./testRunTypes";

type CustomToolTestPanelProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

export function CustomToolTestPanel({
  draft,
  onDraftChange,
}: CustomToolTestPanelProps) {
  const validation = validateCustomToolDraft(draft);
  const [values, setValues] = useState(() => createInitialTestValues(draft));
  const [logs, setLogs] = useState<TestRunLog[]>([]);
  const [previews, setPreviews] = useState<TestRunAppendPreview[]>([]);
  const [outputs, setOutputs] = useState<Record<string, unknown>>({});
  const [isRunning, setIsRunning] = useState(false);

  const inputValues = useMemo(() => {
    return { ...createInitialTestValues(draft), ...values };
  }, [draft, values]);

  const updateValue = (inputId: string, value: TestInputValues[string]) => {
    setValues((currentValues) => ({ ...currentValues, [inputId]: value }));
  };

  const runDryTest = async () => {
    if (!validation.canPublish || isRunning) return;

    setIsRunning(true);

    try {
      const result = await runCustomToolDryRun(draft, inputValues);
      setLogs(result.logs);
      setPreviews(result.appendPreviews);
      setOutputs(result.outputByBlockId);

      if (result.succeeded) {
        onDraftChange(markCustomToolDraftTested(draft));
      }
    } catch (error) {
      setPreviews([]);
      setOutputs({});
      setLogs([
        createTestRunLog(
          "error",
          error instanceof Error ? error.message : "Dry run failed unexpectedly.",
        ),
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dry run test</CardTitle>
        <CardDescription>
          Test the workflow model without writing files. Outputs are shown so
          each block result can be inspected.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {draft.inputs.map((input) => (
          <TestRunInputField
            key={input.id}
            input={input}
            value={inputValues[input.id]}
            onValueChange={(value) => updateValue(input.id, value)}
          />
        ))}

        <Button
          type="button"
          onClick={runDryTest}
          disabled={!validation.canPublish || isRunning}
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {isRunning ? "Running dry test..." : "Run dry test"}
        </Button>

        {!validation.canPublish ? (
          <p className="text-sm text-muted-foreground">
            Fix validation errors before running a dry test.
          </p>
        ) : null}

        <TestRunLogs logs={logs} />
        <TestRunAppendPreviews previews={previews} />
        <TestRunBlockOutputs
          blocks={draft.workflow.blocks}
          outputs={outputs}
        />
      </CardContent>
    </Card>
  );
}