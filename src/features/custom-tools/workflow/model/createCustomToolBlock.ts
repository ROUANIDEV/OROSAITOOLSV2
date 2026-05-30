import type {
  CustomToolBlock,
  CustomToolBlockType,
} from "../../domain/customToolTypes";
import { isFoundationCustomToolBlockType } from "../../domain/customToolTypes";
import { createBlockConfigPreset } from "./blockConfigPresets";
import { getBlockTypeLabel } from "./blockTypeOptions";

function randomIdPart() {
  return Math.random().toString(36).slice(2, 10);
}

function createBlockId(type: CustomToolBlockType | string) {
  return `${String(type).replace(/[^a-zA-Z0-9]+/g, "-")}-${randomIdPart()}`;
}

function createRuntimeId(prefix: string) {
  return `${prefix}_${randomIdPart().slice(0, 6)}`;
}

export function createCustomToolBlock(
  type: CustomToolBlockType,
): CustomToolBlock {
  const blockId = createBlockId(type);
  const config = createBlockConfigPreset(type);
  let label = getBlockTypeLabel(type);

  if (type === "io.input") {
    config.inputId = createRuntimeId("input");
    label = "Number input";
  }

  if (type === "io.output") {
    config.outputId = createRuntimeId("output");
    label = "Result";
  }

  if (type === "math.operation") {
    config.resultName = createRuntimeId("math");
    label = "Math operation";
  }

  if (type === "logic.compare") {
    config.resultName = createRuntimeId("compare");
    label = "Compare";
  }

  return {
    id: blockId,
    type,
    label,
    description: "",
    executionMode: isFoundationCustomToolBlockType(type) ? "model" : "runtime",
    config,
  };
}
