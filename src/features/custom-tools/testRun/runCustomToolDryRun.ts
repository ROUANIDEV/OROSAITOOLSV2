import type {
  CustomToolBlock,
  CustomToolManifest,
} from "../model/customToolTypes";
import { renderTemplate } from "./templateRenderer";
import type { TestInputValues, TestRunLog, TestRunResult } from "./testRunTypes";

function createLog(level: TestRunLog["level"], message: string): TestRunLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
  };
}

function getTextConfig(block: CustomToolBlock, key: string) {
  const value = block.config[key];

  return typeof value === "string" ? value : "";
}

function getInputValue(values: TestInputValues, inputId: string) {
  return values[inputId] ?? "";
}

function runBlock(
  block: CustomToolBlock,
  values: TestInputValues,
  outputByBlockId: Record<string, unknown>,
  logs: TestRunLog[],
) {
  if (block.type === "file.glob") {
    const rootInput = getTextConfig(block, "rootInput");
    const pattern = getTextConfig(block, "pattern");

    logs.push(
      createLog(
        "info",
        `Would search "${getInputValue(values, rootInput)}" using pattern "${pattern}".`,
      ),
    );

    outputByBlockId[block.id] = {
      kind: "fileList",
      files: [],
      fileCount: 0,
    };

    return;
  }

  if (block.type === "file.read") {
    const fileInput = getTextConfig(block, "fileInput");
    logs.push(createLog("info", `Would read file "${getInputValue(values, fileInput)}".`));
    outputByBlockId[block.id] = "";
    return;
  }

  if (block.type === "text.template") {
    const template = getTextConfig(block, "template");
    const rendered = renderTemplate(template, {
      inputs: values,
      extraValues: {
        date: new Date().toISOString().slice(0, 10),
        fileCount: 0,
      },
    });

    logs.push(createLog("success", `Rendered template: ${rendered}`));
    outputByBlockId[block.id] = rendered;
    return;
  }

  if (block.type === "safety.preview") {
    logs.push(createLog("info", `Would show preview for "${block.label}".`));
    outputByBlockId[block.id] = null;
    return;
  }

  if (block.type === "file.appendText") {
    const targetInput = getTextConfig(block, "targetInput");
    logs.push(
      createLog(
        "warning",
        `Would append generated text to "${getInputValue(values, targetInput)}".`,
      ),
    );
    outputByBlockId[block.id] = null;
    return;
  }

  if (block.type === "safety.confirm") {
    logs.push(createLog("info", `Would ask confirmation: "${getTextConfig(block, "message")}".`));
    outputByBlockId[block.id] = true;
    return;
  }

  logs.push(createLog("warning", `Dry run does not execute "${block.type}" yet.`));
}

export function runCustomToolDryRun(
  draft: CustomToolManifest,
  values: TestInputValues,
): TestRunResult {
  const logs: TestRunLog[] = [
    createLog("info", `Starting dry run for "${draft.name}".`),
  ];
  const outputByBlockId: Record<string, unknown> = {};

  draft.workflow.blocks.forEach((block) => {
    runBlock(block, values, outputByBlockId, logs);
  });

  logs.push(createLog("success", "Dry run completed without real file changes."));

  return {
    logs,
    outputByBlockId,
  };
}