import type {
  CustomToolBlock,
  CustomToolManifest,
} from "../model/customToolTypes";
import {
  runFileReadBlock,
  runSafetyConfirmBlock,
  runSafetyPreviewBlock,
  runTextTemplateBlock,
} from "./dryRunBasicBlocks";
import type { DryRunContext } from "./dryRunContext";
import { createTestRunLog } from "./dryRunLogs";
import {
  runAppendTextBlock,
  runFileGlobBlock,
} from "./dryRunFileBlocks";
import { runPythonCodeBlock } from "./dryRunPythonBlock";
import type { TestInputValues, TestRunResult } from "./testRunTypes";

export type RunCustomToolDryRunOptions = {
  executePython?: boolean;
};

async function runBlock(
  block: CustomToolBlock,
  draft: CustomToolManifest,
  context: DryRunContext,
  options: RunCustomToolDryRunOptions,
) {
  if (block.type === "file.glob") {
    return await runFileGlobBlock(block, context);
  }

  if (block.type === "file.read") {
    return runFileReadBlock(block, context);
  }

  if (block.type === "text.template") {
    return runTextTemplateBlock(block, context);
  }

  if (block.type === "python.code") {
    return await runPythonCodeBlock(block, context, {
      executePython: options.executePython === true,
      pythonPermission: draft.permissions.python,
    });
  }

  if (block.type === "safety.preview") {
    return runSafetyPreviewBlock(block, context);
  }

  if (block.type === "file.appendText") {
    return runAppendTextBlock(block, context);
  }

  if (block.type === "safety.confirm") {
    return runSafetyConfirmBlock(block, context);
  }

  context.logs.push(
    createTestRunLog("warning", `Dry run does not execute "${block.type}" yet.`),
  );
  return true;
}

export async function runCustomToolDryRun(
  draft: CustomToolManifest,
  values: TestInputValues,
  options: RunCustomToolDryRunOptions = {},
): Promise<TestRunResult> {
  const context: DryRunContext = {
    values,
    logs: [createTestRunLog("info", `Starting dry run for "${draft.name}".`)],
    outputByBlockId: {},
    appendPreviews: [],
  };

  let succeeded = true;

  for (const block of draft.workflow.blocks) {
    const blockSucceeded = await runBlock(block, draft, context, options);
    succeeded = succeeded && blockSucceeded;
  }

  context.logs.push(
    succeeded
      ? createTestRunLog("success", "Dry run completed without file writes.")
      : createTestRunLog("error", "Dry run finished with errors."),
  );

  return {
    logs: context.logs,
    outputByBlockId: context.outputByBlockId,
    appendPreviews: context.appendPreviews,
    succeeded,
  };
}
