import type { CustomToolBlock } from "../../domain/customToolTypes";
import type { TestRunAppendPreview } from "../state/testRunTypes";

type CreateAppendTextPreviewArgs = {
  block: CustomToolBlock;
  targetPath: string;
  appendedText: string;
};

function ensureTrailingNewline(text: string) {
  if (!text) {
    return "";
  }

  return text.endsWith("\n") ? text : `${text}\n`;
}

function createDiffText(targetPath: string, appendedText: string) {
  const previewText = ensureTrailingNewline(appendedText);
  const lines = previewText.split(/\r?\n/);
  const bodyLines =
    lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines;

  return [
    `--- ${targetPath}`,
    `+++ ${targetPath}`,
    "@@ append preview - original file not read @@",
    ...(bodyLines.length > 0 ? bodyLines.map((line) => `+${line}`) : ["+"]),
  ].join("\n");
}

export function createAppendTextPreview({
  block,
  targetPath,
  appendedText,
}: CreateAppendTextPreviewArgs): TestRunAppendPreview {
  return {
    id: `${block.id}-${Date.now()}`,
    blockId: block.id,
    blockLabel: block.label,
    targetPath,
    appendedText: ensureTrailingNewline(appendedText),
    diffText: createDiffText(targetPath, appendedText),
  };
}