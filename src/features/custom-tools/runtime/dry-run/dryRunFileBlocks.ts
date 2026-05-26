import type { CustomToolBlock } from "../../domain/customToolTypes";
import { createAppendTextPreview } from "../templates/appendTextPreview";
import type { DryRunContext } from "./dryRunContext";
import { getTextConfig } from "./dryRunContext";
import { createTestRunLog } from "./dryRunLogs";
import {
  createEmptyFileList,
  getInputValue,
  getLatestTextOutput,
  stringifyTestValue,
} from "./dryRunOutputUtils";
import { scanCustomToolFiles } from "../files/scanCustomToolFiles";

export async function runFileGlobBlock(
  block: CustomToolBlock,
  context: DryRunContext,
): Promise<boolean> {
  const rootInput = getTextConfig(block, "rootInput");
  const pattern = getTextConfig(block, "pattern") || "**/*";
  const rootPath = stringifyTestValue(getInputValue(context.values, rootInput)).trim();

  if (!rootInput) {
    context.logs.push(
      createTestRunLog("error", `"${block.label}" is missing rootInput.`),
    );
    context.outputByBlockId[block.id] = createEmptyFileList();
    return false;
  }

  if (!rootPath) {
    context.logs.push(
      createTestRunLog("error", `"${block.label}" needs a folder path.`),
    );
    context.outputByBlockId[block.id] = createEmptyFileList();
    return false;
  }

  try {
    const result = await scanCustomToolFiles({ rootPath, pattern, maxResults: 200 });
    context.logs.push(
      createTestRunLog(
        "success",
        `Found ${result.matchedCount} file(s) in "${rootPath}" using "${pattern}".`,
      ),
    );

    if (result.truncated) {
      context.logs.push(
        createTestRunLog("warning", `Showing first ${result.returnedCount} match(es).`),
      );
    }

    context.outputByBlockId[block.id] = {
      kind: "fileList",
      files: result.files,
      fileCount: result.matchedCount,
    };
    return true;
  } catch (error) {
    context.logs.push(
      createTestRunLog(
        "error",
        error instanceof Error ? error.message : "File search failed.",
      ),
    );
    context.outputByBlockId[block.id] = createEmptyFileList();
    return false;
  }
}

export function runAppendTextBlock(
  block: CustomToolBlock,
  context: DryRunContext,
) {
  const targetInput = getTextConfig(block, "targetInput");
  const targetPath = stringifyTestValue(
    getInputValue(context.values, targetInput),
  ).trim();

  if (!targetInput || !targetPath) {
    context.logs.push(
      createTestRunLog("error", `"${block.label}" needs a target file path.`),
    );
    return false;
  }

  const appendedText = getLatestTextOutput(context.outputByBlockId);
  const preview = createAppendTextPreview({ block, targetPath, appendedText });
  context.appendPreviews.push(preview);
  context.outputByBlockId[block.id] = preview;

  context.logs.push(
    createTestRunLog("success", `Prepared append preview for "${targetPath}".`),
  );

  if (!appendedText.trim()) {
    context.logs.push(createTestRunLog("warning", "Append preview is empty."));
  }

  return true;
}