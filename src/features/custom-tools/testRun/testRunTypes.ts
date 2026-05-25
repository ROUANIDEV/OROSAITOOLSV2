export type TestInputValues = Record<string, string | number | boolean>;

export type TestRunLogLevel = "info" | "warning" | "error" | "success";

export type TestRunLog = {
  id: string;
  level: TestRunLogLevel;
  message: string;
};

export type TestRunResult = {
  logs: TestRunLog[];
  outputByBlockId: Record<string, unknown>;
};