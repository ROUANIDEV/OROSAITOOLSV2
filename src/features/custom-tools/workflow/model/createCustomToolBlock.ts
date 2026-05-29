import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
  type CustomToolBlockType,
} from "../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../foundation";
import { createBlockConfigPreset } from "./blockConfigPresets";
import { getBlockTypeDescription, getBlockTypeLabel } from "./blockTypeOptions";

function createBlockId(type: CustomToolBlockType) {
  const safeType = type.replace(/\./g, "-");
  const randomPart = Math.random().toString(36).slice(2, 8);

  return `${safeType}-${Date.now()}-${randomPart}`;
}

export function createCustomToolBlock(
  type: CustomToolBlockType = "text.template",
): CustomToolBlock {
  if (isFoundationCustomToolBlockType(type)) {
    const definition = getFoundationBlockDefinition(type);

    return {
      id: createBlockId(type),
      type,
      label: definition.defaultLabel,
      description: definition.summary,
      executionMode: "model",
      config: {
        ...createBlockConfigPreset(type),
        _foundation: {
          category: definition.category,
          kind: definition.kind,
          modelOnly: true,
        },
      },
    };
  }

  return {
    id: createBlockId(type),
    type,
    label: getBlockTypeLabel(type),
    description: getBlockTypeDescription(type) || "Describe what this block does.",
    executionMode: "runtime",
    config: createBlockConfigPreset(type),
  };
}