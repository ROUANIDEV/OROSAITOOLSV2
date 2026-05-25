import type { CustomToolBlock } from "../model/customToolTypes";
import type {
  TestInputValues,
  TestRunAppendPreview,
  TestRunLog,
} from "./testRunTypes";

export type DryRunContext = {
  values: TestInputValues;
  outputByBlockId: Record<string, unknown>;
  appendPreviews: TestRunAppendPreview[];
  logs: TestRunLog[];
};

export function getTextConfig(block: CustomToolBlock, key: string) {
  const value = block.config[key];
  return typeof value === "string" ? value : "";
}