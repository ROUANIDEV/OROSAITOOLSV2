import type { CustomToolBlock } from "../../domain/customToolTypes";
import type { DryRunContext } from "./dryRunContext";
import { getTextConfig } from "./dryRunContext";
import { createTestRunLog } from "./dryRunLogs";
import {
  getInputValue,
  getLatestFileCount,
} from "./dryRunOutputUtils";
import { renderTemplate } from "../templates/templateRenderer";

export function runFileReadBlock(
  block: CustomToolBlock,
  context: DryRunContext,
) {
  const fileInput = getTextConfig(block, "fileInput");
  context.logs.push(
    createTestRunLog(
      "info",
      `Would read file "${getInputValue(context.values, fileInput)}".`,
    ),
  );
  context.outputByBlockId[block.id] = "";
  return true;
}

export function runTextTemplateBlock(
  block: CustomToolBlock,
  context: DryRunContext,
) {
  const template = getTextConfig(block, "template");
  const rendered = renderTemplate(template, {
    inputs: context.values,
    outputs: context.outputByBlockId,
    extraValues: {
      date: new Date().toISOString().slice(0, 10),
      fileCount: getLatestFileCount(context.outputByBlockId),
    },
  });

  context.logs.push(createTestRunLog("success", `Rendered template: ${rendered}`));
  context.outputByBlockId[block.id] = rendered;
  return true;
}

export function runSafetyPreviewBlock(
  block: CustomToolBlock,
  context: DryRunContext,
) {
  context.logs.push(
    createTestRunLog("info", `Would show preview for "${block.label}".`),
  );
  context.outputByBlockId[block.id] = null;
  return true;
}

export function runSafetyConfirmBlock(
  block: CustomToolBlock,
  context: DryRunContext,
) {
  context.logs.push(
    createTestRunLog(
      "info",
      `Would ask confirmation: "${getTextConfig(block, "message")}".`,
    ),
  );
  context.outputByBlockId[block.id] = true;
  return true;
}