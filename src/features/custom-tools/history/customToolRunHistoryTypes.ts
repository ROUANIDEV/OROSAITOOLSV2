import type { TestRunAppendPreview, TestRunLog } from "../testRun/testRunTypes";

export type CustomToolRunKind = "dry-run" | "confirmed";

export type CustomToolRunStatus = "success" | "failed";

export type CustomToolRunHistoryEntry = {
  id: string;
  toolId: string;
  toolName: string;
  runKind: CustomToolRunKind;
  status: CustomToolRunStatus;
  createdAt: string;
  logs: TestRunLog[];
  outputByBlockId: Record<string, unknown>;
  appendPreviews: TestRunAppendPreview[];
  appendPreviewCount: number;
  bytesAppended?: number;
  errorMessage?: string;
};

export type CustomToolRunHistoryData = {
  entries: CustomToolRunHistoryEntry[];
};