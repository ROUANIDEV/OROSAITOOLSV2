import type {
  CustomToolBlock,
  CustomToolBlockType,
} from "../model/customToolTypes";
import { defaultBlockConfigByType } from "./blockConfigPresets";
import { getBlockTypeLabel } from "./blockTypeOptions";

function createBlockId(type: CustomToolBlockType) {
  const safeType = type.replace(".", "-");
  const randomPart = Math.random().toString(36).slice(2, 8);

  return `${safeType}-${Date.now()}-${randomPart}`;
}

export function createCustomToolBlock(
  type: CustomToolBlockType = "text.template",
): CustomToolBlock {
  return {
    id: createBlockId(type),
    type,
    label: getBlockTypeLabel(type),
    description: "Describe what this block does.",
    config: defaultBlockConfigByType[type],
  };
}