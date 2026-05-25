import type { TestInputValues } from "./testRunTypes";

export type FileListDryRunOutput = {
  kind: "fileList";
  files: unknown[];
  fileCount: number;
};

export function stringifyTestValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export function getInputValue(values: TestInputValues, inputId: string) {
  return values[inputId] ?? "";
}

export function createEmptyFileList(): FileListDryRunOutput {
  return {
    kind: "fileList",
    files: [],
    fileCount: 0,
  };
}

export function getLatestFileCount(outputByBlockId: Record<string, unknown>) {
  const outputs = Object.values(outputByBlockId).reverse();

  for (const output of outputs) {
    if (typeof output !== "object" || output === null) {
      continue;
    }

    if (!("kind" in output) || !("fileCount" in output)) {
      continue;
    }

    if (output.kind === "fileList" && typeof output.fileCount === "number") {
      return output.fileCount;
    }
  }

  return 0;
}

export function getLatestTextOutput(outputByBlockId: Record<string, unknown>) {
  const outputs = Object.values(outputByBlockId).reverse();

  for (const output of outputs) {
    if (typeof output === "string") {
      return output;
    }
  }

  return "";
}