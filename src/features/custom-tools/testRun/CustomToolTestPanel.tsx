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
import { runCustomToolDryRun } from "./runCustomToolDryRun";
import { TestRunInputField } from "./TestRunInputField";
import { TestRunLogs } from "./TestRunLogs";
import type { TestInputValues, TestRunLog } from "./testRunTypes";

type CustomToolTestPanelProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

export function CustomToolTestPanel({
  draft,
  onDraftChange,
}: CustomToolTestPanelProps) {
  const validation = validateCustomToolDraft(draft);
  const [values, setValues] = useState<TestInputValues>(() =>
    createInitialTestValues(draft),
  );
  const [logs, setLogs] = useState<TestRunLog[]>([]);

  const inputValues = useMemo(() => {
    return {
      ...createInitialTestValues(draft),
      ...values,
    };
  }, [draft, values]);

  const updateValue = (inputId: string, value: TestInputValues[string]) => {
    setValues((currentValues) => ({
      ...currentValues,
      [inputId]: value,
    }));
  };

  const runDryTest = () => {
    const result = runCustomToolDryRun(draft, inputValues);

    setLogs(result.logs);
    onDraftChange(markCustomToolDraftTested(draft));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dry run test</CardTitle>
        <CardDescription>
          Test the workflow model without reading or writing real files.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-3">
          {draft.inputs.map((input) => (
            <TestRunInputField
              key={input.id}
              input={input}
              value={inputValues[input.id]}
              onValueChange={(value) => updateValue(input.id, value)}
            />
          ))}
        </div>

        <Button disabled={!validation.canPublish} onClick={runDryTest}>
          <PlayCircle className="size-4" />
          Run dry test
        </Button>

        {!validation.canPublish ? (
          <p className="text-sm text-muted-foreground">
            Fix validation errors before running a dry test.
          </p>
        ) : null}

        <TestRunLogs logs={logs} />
      </CardContent>
    </Card>
  );
}