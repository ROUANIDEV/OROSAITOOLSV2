import type { CustomToolBlock } from "../../domain/customToolTypes";
import type {
  TestInputValues,
  TestRunAppendPreview,
  TestRunLog,
} from "../state/testRunTypes";

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