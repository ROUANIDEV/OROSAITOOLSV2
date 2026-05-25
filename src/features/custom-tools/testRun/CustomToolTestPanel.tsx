import { useMemo, useState, type SetStateAction } from "react";

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
import { TestRunExecutionPlan } from "./TestRunExecutionPlan";
import { TestRunInputField } from "./TestRunInputField";
import { TestRunLogs } from "./TestRunLogs";

import type {
  TestInputValues,
  TestRunAppendPreview,
  TestRunExecutionPlanItem,
  TestRunLog,
} from "./testRunTypes";

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

function createDefaultTestPanelSession(
  draft: CustomToolManifest,
): CustomToolTestPanelSession {
  return {
    values: createInitialTestValues(draft),
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
    executionPlan: Array.isArray(session.executionPlan)
      ? session.executionPlan
      : [],
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

export function CustomToolTestPanel({
  draft,
  session,
  onSessionChange,
  onDraftChange,
}: CustomToolTestPanelProps) {
  const validation = validateCustomToolDraft(draft);

  const [localSession, setLocalSession] =
    useState<CustomToolTestPanelSession>(() =>
      createDefaultTestPanelSession(draft),
    );

  const currentSession = normalizeTestPanelSession(
    draft,
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

  const inputValues = useMemo(() => {
    return {
      ...createInitialTestValues(draft),
      ...currentSession.values,
    };
  }, [draft, currentSession.values]);

  const [isRunning, setIsRunning] = useState(false);

  const updateValue = (inputId: string, value: TestInputValues[string]) => {
    commitSession((currentValue) => ({
      ...currentValue,
      values: {
        ...currentValue.values,
        [inputId]: value,
      },
    }));
  };

  const runDryTest = async () => {
    if (!validation.canPublish || isRunning) {
      return;
    }

    setIsRunning(true);

    try {
      const result = await runCustomToolDryRun(draft, inputValues);

      commitSession((currentValue) => ({
        ...currentValue,
        logs: result.logs,
        previews: result.appendPreviews,
        executionPlan: result.executionPlan ?? [],
        outputs: result.outputByBlockId,
      }));

      if (result.succeeded) {
        onDraftChange(markCustomToolDraftTested(draft));
      }
    } catch (error) {
      commitSession((currentValue) => ({
        ...currentValue,
        logs: [
          createTestRunLog(
            "error",
            error instanceof Error
              ? error.message
              : "Dry run failed unexpectedly.",
          ),
        ],
        previews: [],
        executionPlan: [],
        outputs: {},
      }));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dry run test</CardTitle>
        <CardDescription>
          Test the workflow model without writing files. Inputs, logs, outputs,
          previews, and the execution plan are remembered while you move between
          builder panels.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {draft.inputs.length > 0 ? (
          <div className="grid gap-3">
            {draft.inputs.map((input) => (
              <TestRunInputField
                key={input.id}
                input={input}
                value={inputValues[input.id]}
                onValueChange={(value: TestInputValues[string]) =>
                  updateValue(input.id, value)
                }
              />
            ))}
          </div>
        ) : null}

        <Button
          type="button"
          onClick={runDryTest}
          disabled={!validation.canPublish || isRunning}
        >
          <PlayCircle className="size-4" />
          {isRunning ? "Running dry test..." : "Run dry test"}
        </Button>

        {!validation.canPublish ? (
          <p className="text-sm text-muted-foreground">
            Fix validation errors before running a dry test.
          </p>
        ) : null}

        {draft.status === "tested" || draft.status === "published" ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            This workflow has a successful dry test. You can publish it from the
            Publish tab.
          </p>
        ) : null}

        <TestRunExecutionPlan plan={currentSession.executionPlan} />
        <TestRunLogs logs={currentSession.logs} />
        <TestRunBlockOutputs outputs={currentSession.outputs} />
        <TestRunAppendPreviews previews={currentSession.previews} />
      </CardContent>
    </Card>
  );
}