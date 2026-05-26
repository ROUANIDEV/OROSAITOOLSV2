import type { TestRunLog } from "../model/testRunTypes";

export function createTestRunLog(
  level: TestRunLog["level"],
  message: string,
): TestRunLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
  };
}