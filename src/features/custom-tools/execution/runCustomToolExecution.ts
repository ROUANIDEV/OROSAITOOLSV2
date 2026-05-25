import type { CustomToolManifest } from "../model/customToolTypes";
import { createTestRunLog } from "../testRun/dryRunLogs";
import { runCustomToolDryRun } from "../testRun/runCustomToolDryRun";
import type {
  TestInputValues,
  TestRunAppendPreview,
  TestRunExecutionPlanItem,
  TestRunLog,
} from "../testRun/testRunTypes";
import { appendCustomToolText } from "./appendCustomToolText";

const REQUIRED_CONFIRMATION = "APPEND";

export type CustomToolExecutionResult = {
  logs: TestRunLog[];
  executionPlan: TestRunExecutionPlanItem[];
  appendPreviews: TestRunAppendPreview[];
  outputByBlockId: Record<string, unknown>;
  bytesAppended: number;
  succeeded: boolean;
};

function emptyResult(logs: TestRunLog[]): CustomToolExecutionResult {
  return {
    logs,
    executionPlan: [],
    appendPreviews: [],
    outputByBlockId: {},
    bytesAppended: 0,
    succeeded: false,
  };
}

function hasBlockType(tool: CustomToolManifest, blockType: string) {
  return tool.workflow.blocks.some((block) => block.type === blockType);
}

export async function runCustomToolExecution(
  tool: CustomToolManifest,
  values: TestInputValues,
  confirmation: string,
): Promise<CustomToolExecutionResult> {
  const logs: TestRunLog[] = [];
  const hasAppendBlocks = hasBlockType(tool, "file.appendText");
  const hasPythonBlocks = hasBlockType(tool, "python.code");

  if (hasAppendBlocks && !tool.permissions.fileWrite) {
    logs.push(
      createTestRunLog("error", "Real append execution requires fileWrite permission."),
    );

    return emptyResult(logs);
  }

  if (hasPythonBlocks && !tool.permissions.python) {
    logs.push(createTestRunLog("error", "Python execution requires python permission."));

    return emptyResult(logs);
  }

  if (hasAppendBlocks && confirmation.trim() !== REQUIRED_CONFIRMATION) {
    logs.push(createTestRunLog("error", "Type APPEND to confirm file writes."));

    return emptyResult(logs);
  }

  logs.push(createTestRunLog("info", "Running confirmed workflow preview."));

  const previewResult = await runCustomToolDryRun(tool, values, {
    executePython: hasPythonBlocks,
  });

  logs.push(...previewResult.logs);

  if (!previewResult.succeeded) {
    logs.push(createTestRunLog("error", "Execution stopped because preview failed."));

    return {
      logs,
      executionPlan: previewResult.executionPlan,
      appendPreviews: previewResult.appendPreviews,
      outputByBlockId: previewResult.outputByBlockId,
      bytesAppended: 0,
      succeeded: false,
    };
  }

  let bytesAppended = 0;

  for (const preview of previewResult.appendPreviews) {
    const result = await appendCustomToolText({
      targetPath: preview.targetPath,
      text: preview.appendedText,
      confirmation,
      fileWritePermission: tool.permissions.fileWrite,
    });

    bytesAppended += result.bytesAppended;

    logs.push(
      createTestRunLog(
        "success",
        `Appended ${result.bytesAppended} byte(s) to "${result.targetPath}".`,
      ),
    );
  }

  logs.push(
    createTestRunLog(
      "success",
      hasAppendBlocks
        ? "Confirmed workflow execution completed."
        : "Confirmed workflow completed without file writes.",
    ),
  );

  return {
    logs,
    executionPlan: previewResult.executionPlan,
    appendPreviews: previewResult.appendPreviews,
    outputByBlockId: previewResult.outputByBlockId,
    bytesAppended,
    succeeded: true,
  };
}