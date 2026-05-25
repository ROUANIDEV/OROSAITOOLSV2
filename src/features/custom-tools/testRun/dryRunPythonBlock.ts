import type { CustomToolBlock } from "../model/customToolTypes";
import { runCustomToolPython } from "../execution/runCustomToolPython";
import type { DryRunContext } from "./dryRunContext";
import { getTextConfig } from "./dryRunContext";
import { createTestRunLog } from "./dryRunLogs";
import { getLatestFileCount } from "./dryRunOutputUtils";

type RunPythonCodeBlockOptions = {
  executePython: boolean;
  pythonPermission: boolean;
};

function getTimeoutMs(block: CustomToolBlock) {
  const value = block.config.timeoutMs;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 5000;
  }

  return 5000;
}

export async function runPythonCodeBlock(
  block: CustomToolBlock,
  context: DryRunContext,
  options: RunPythonCodeBlockOptions,
) {
  if (!options.executePython) {
    context.logs.push(
      createTestRunLog(
        "info",
        `Would run Python block "${block.label}" during confirmed execution.`,
      ),
    );
    context.outputByBlockId[block.id] = null;
    return true;
  }

  if (!options.pythonPermission) {
    context.logs.push(
      createTestRunLog("error", `"${block.label}" requires python permission.`),
    );
    context.outputByBlockId[block.id] = null;
    return false;
  }

  const code = getTextConfig(block, "code");

  if (!code.trim()) {
    context.logs.push(
      createTestRunLog("error", `"${block.label}" has no Python code.`),
    );
    context.outputByBlockId[block.id] = null;
    return false;
  }

  const result = await runCustomToolPython({
    code,
    timeoutMs: getTimeoutMs(block),
    pythonPermission: options.pythonPermission,
    inputJson: {
      inputs: context.values,
      outputs: context.outputByBlockId,
      block: {
        id: block.id,
        label: block.label,
        type: block.type,
      },
      extraValues: {
        fileCount: getLatestFileCount(context.outputByBlockId),
        date: new Date().toISOString().slice(0, 10),
      },
    },
  });

  if (result.timedOut) {
    context.logs.push(createTestRunLog("error", `"${block.label}" timed out.`));
    context.outputByBlockId[block.id] = null;
    return false;
  }

  if (result.exitCode !== 0) {
    context.logs.push(
      createTestRunLog(
        "error",
        `"${block.label}" exited with code ${result.exitCode ?? "unknown"}.`,
      ),
    );

    if (result.stderr.trim()) {
      context.logs.push(createTestRunLog("error", result.stderr.trim()));
    }

    context.outputByBlockId[block.id] = null;
    return false;
  }

  context.outputByBlockId[block.id] = result.outputJson;
  context.logs.push(
    createTestRunLog(
      "success",
      `Python block "${block.label}" completed in ${result.durationMs}ms.`,
    ),
  );

  if (result.stderr.trim()) {
    context.logs.push(createTestRunLog("warning", result.stderr.trim()));
  }

  return true;
}