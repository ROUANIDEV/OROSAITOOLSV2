export type TestInputValues = Record<string, string | number | boolean>;

export type TestRunLogLevel = "info" | "warning" | "error" | "success";

export type TestRunLog = {
  id: string;
  level: TestRunLogLevel;
  message: string;
};

export type TestRunExecutionPlanItem = {
  blockId: string;
  blockLabel: string;
  blockType: string;
  stepIndex: number;
};

export type TestRunAppendPreview = {
  id: string;
  blockId: string;
  blockLabel: string;
  targetPath: string;
  appendedText: string;
  diffText: string;
};

export type TestRunResult = {
  logs: TestRunLog[];
  executionPlan: TestRunExecutionPlanItem[];
  outputByBlockId: Record<string, unknown>;
  appendPreviews: TestRunAppendPreview[];
  succeeded: boolean;
};