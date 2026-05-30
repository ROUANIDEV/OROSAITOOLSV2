import type {
  CustomToolBlock,
  CustomToolManifest,
} from "../../domain/customToolTypes";
import { isFoundationCustomToolBlockType } from "../../domain/customToolTypes";
import {
  runFoundationWorkflowFromBlocks,
  toFoundationRunErrorMessage,
} from "../foundationWorkflowRuntime";
import { resolveVisualWorkflowOrder } from "../../workflow/resolveVisualWorkflowOrder";
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
import type {
  TestInputValues,
  TestRunExecutionPlanItem,
  TestRunResult,
} from "../state/testRunTypes";

export type RunCustomToolDryRunOptions = {
  executePython?: boolean;
};

function createExecutionPlan(
  blocks: CustomToolBlock[],
): TestRunExecutionPlanItem[] {
  return blocks.map((block, index) => {
    return {
      blockId: block.id,
      blockLabel: block.label,
      blockType: block.type,
      stepIndex: index + 1,
    };
  });
}

function isFoundationOnlyWorkflow(blocks: CustomToolBlock[]) {
  return (
    blocks.length > 0 &&
    blocks.every((block) => isFoundationCustomToolBlockType(block.type))
  );
}

function normalizeOutputByBlockId(outputs: unknown) {
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    return {};
  }
  return outputs as Record<string, unknown>;
}

async function runFoundationOnlyDryRun(
  draft: CustomToolManifest,
  blocks: CustomToolBlock[],
  values: TestInputValues,
  executionPlan: TestRunExecutionPlanItem[],
): Promise<TestRunResult> {
  const logs = [
    createTestRunLog(
      "info",
      `Starting Rust foundation dry run for "${draft.name}".`,
    ),
  ];

  try {
    const report = await runFoundationWorkflowFromBlocks(
      blocks,
      {
        dryRun: true,
        failFast: false,
        maxLoopIterations: 1_000,
      },
      draft.workflow.visualConnections ?? [],
      values as Record<string, unknown>,
    );

    logs.push(
      createTestRunLog(
        "info",
        `Rust foundation execution used ${report.orderLabel}.`,
      ),
    );

    for (const skippedBlock of report.skippedBlocks) {
      logs.push(
        createTestRunLog(
          "warning",
          `${skippedBlock.label}: ${skippedBlock.reason}`,
        ),
      );
    }

    for (const diagnostic of report.result.diagnostics ?? []) {
      const level =
        diagnostic.severity === "error"
          ? "error"
          : diagnostic.severity === "warning"
            ? "warning"
            : "info";
      logs.push(
        createTestRunLog(
          level,
          `${diagnostic.blockId ?? diagnostic.block_id ?? "workflow"}: ${
            diagnostic.message ?? "Foundation runtime diagnostic."
          }${diagnostic.help ? ` ${diagnostic.help}` : ""}`,
        ),
      );
    }

    for (const traceItem of report.result.trace ?? []) {
      logs.push(
        createTestRunLog(
          traceItem.status === "error" ? "error" : "info",
          `${traceItem.blockId ?? traceItem.block_id ?? "block"}: ${
            traceItem.summary ?? "Executed foundation block."
          }`,
        ),
      );
    }

    const succeeded = report.result.ok === true;
    logs.push(
      succeeded
        ? createTestRunLog("success", "Rust foundation dry run completed.")
        : createTestRunLog("error", "Rust foundation dry run finished with errors."),
    );

    return {
      logs,
      executionPlan,
      outputByBlockId: normalizeOutputByBlockId(report.result.outputs),
      appendPreviews: [],
      succeeded,
    };
  } catch (error) {
    logs.push(
      createTestRunLog(
        "error",
        `Rust foundation dry run failed: ${toFoundationRunErrorMessage(error)}`,
      ),
    );
    return {
      logs,
      executionPlan,
      outputByBlockId: {},
      appendPreviews: [],
      succeeded: false,
    };
  }
}

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
  if (isFoundationCustomToolBlockType(block.type)) {
    context.logs.push(
      createTestRunLog(
        "warning",
        `Foundation block "${block.type}" must run through the Rust foundation workflow runner.`,
      ),
    );
    return false;
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

  const resolvedWorkflowOrder = resolveVisualWorkflowOrder(draft);
  for (const message of resolvedWorkflowOrder.messages) {
    context.logs.push(createTestRunLog(message.level, message.message));
  }

  if (!resolvedWorkflowOrder.succeeded) {
    context.logs.push(
      createTestRunLog(
        "error",
        "Dry run stopped because the visual workflow order is invalid.",
      ),
    );
    return {
      logs: context.logs,
      executionPlan: [],
      outputByBlockId: context.outputByBlockId,
      appendPreviews: context.appendPreviews,
      succeeded: false,
    };
  }

  const executionPlan = createExecutionPlan(resolvedWorkflowOrder.blocks);
  if (executionPlan.length > 0) {
    context.logs.push(
      createTestRunLog(
        "info",
        `Execution plan contains ${executionPlan.length} step(s).`,
      ),
    );
  }

  if (isFoundationOnlyWorkflow(resolvedWorkflowOrder.blocks)) {
    return runFoundationOnlyDryRun(
      draft,
      resolvedWorkflowOrder.blocks,
      values,
      executionPlan,
    );
  }

  let succeeded = true;
  for (const block of resolvedWorkflowOrder.blocks) {
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
    executionPlan,
    outputByBlockId: context.outputByBlockId,
    appendPreviews: context.appendPreviews,
    succeeded,
  };
}
