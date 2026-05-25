import type { CustomToolManifest } from "../model/customToolTypes";
import type { TestRunAppendPreview, TestRunLog } from "../testRun/testRunTypes";
import type {
  CustomToolRunHistoryEntry,
  CustomToolRunKind,
} from "./customToolRunHistoryTypes";

type CreateCustomToolRunHistoryEntryParams = {
  tool: CustomToolManifest;
  runKind: CustomToolRunKind;
  succeeded: boolean;
  logs: TestRunLog[];
  outputByBlockId: Record<string, unknown>;
  appendPreviews?: TestRunAppendPreview[];
  bytesAppended?: number;
  errorMessage?: string;
};

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createCustomToolRunHistoryEntry({
  tool,
  runKind,
  succeeded,
  logs,
  outputByBlockId,
  appendPreviews = [],
  bytesAppended,
  errorMessage,
}: CreateCustomToolRunHistoryEntryParams): CustomToolRunHistoryEntry {
  return {
    id: createHistoryId(),
    toolId: tool.id,
    toolName: tool.name,
    runKind,
    status: succeeded ? "success" : "failed",
    createdAt: new Date().toISOString(),
    logs,
    outputByBlockId,
    appendPreviews,
    appendPreviewCount: appendPreviews.length,
    bytesAppended,
    errorMessage,
  };
}

export function createCustomToolRunErrorLog(message: string): TestRunLog {
  return {
    id: createHistoryId(),
    level: "error",
    message,
  };
}