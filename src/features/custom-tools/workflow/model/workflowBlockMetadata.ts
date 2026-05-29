import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
  type CustomToolInput,
} from "../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../foundation";

function formatInputReference(
  inputId: unknown,
  inputs: CustomToolInput[],
  fallback: string,
) {
  if (typeof inputId !== "string" || inputId.length === 0) return fallback;

  const input = inputs.find((candidate) => candidate.id === inputId);

  return input ? `${input.label} (${input.id})` : inputId;
}

function getFoundationBlockInputDetails(block: CustomToolBlock) {
  if (!isFoundationCustomToolBlockType(block.type)) return [];

  const definition = getFoundationBlockDefinition(block.type);
  const requiredInputs = definition.inputs.filter((port) => port.required);
  const optionalInputs = definition.inputs.length - requiredInputs.length;

  return [
    `${definition.category}: ${definition.summary}`,
    `${requiredInputs.length} required input${
      requiredInputs.length === 1 ? "" : "s"
    } · ${optionalInputs} optional`,
  ];
}

function getFoundationBlockOutputPreview(block: CustomToolBlock) {
  if (!isFoundationCustomToolBlockType(block.type)) return "unknown output";

  const definition = getFoundationBlockDefinition(block.type);

  if (definition.outputs.length === 0) return "No output ports";

  return definition.outputs
    .map((port) => {
      const typeLabel = port.dataType ? `: ${port.dataType}` : "";
      return `${port.label}${typeLabel}`;
    })
    .join(" · ");
}

export function getBlockInputDetails(
  block: CustomToolBlock,
  inputs: CustomToolInput[],
) {
  if (isFoundationCustomToolBlockType(block.type)) {
    return getFoundationBlockInputDetails(block);
  }

  switch (block.type) {
    case "file.glob":
      return [
        `Folder: ${formatInputReference(
          block.config.rootInput,
          inputs,
          "folder input",
        )}`,
        `Pattern: ${String(block.config.pattern ?? "**/*")}`,
      ];

    case "file.read":
      return [
        `File: ${formatInputReference(
          block.config.sourceInput ?? block.config.fileInput,
          inputs,
          "file input",
        )}`,
      ];

    case "text.template":
      return ["Inputs: any {{inputId}} or {{inputs.inputId}} reference"];

    case "python.code":
      return ["JSON stdin: inputs and earlier block outputs"];

    case "safety.preview":
      return ["Preview target: generated text or selected file"];

    case "file.appendText":
      return [
        `Target: ${formatInputReference(
          block.config.targetInput,
          inputs,
          "file input",
        )}`,
      ];

    case "safety.confirm":
      return ["Confirmation: explicit user approval"];

    default:
      return ["Inputs depend on block config"];
  }
}

export function getBlockOutputPreview(block: CustomToolBlock) {
  if (isFoundationCustomToolBlockType(block.type)) {
    return getFoundationBlockOutputPreview(block);
  }

  switch (block.type) {
    case "file.glob":
      return "{ files: [...], fileCount: number }";

    case "file.read":
      return "{ text: string, path: string }";

    case "text.template":
      return "{ text: string }";

    case "python.code":
      return "JSON object printed by Python stdout";

    case "safety.preview":
      return "{ previewed: true }";

    case "file.appendText":
      return "{ bytesAppended: number }";

    case "safety.confirm":
      return "{ confirmed: boolean }";

    default:
      return "unknown output";
  }
}

function isControlFlowFoundationBlock(block: CustomToolBlock) {
  return (
    isFoundationCustomToolBlockType(block.type) &&
    getFoundationBlockDefinition(block.type).category === "control-flow"
  );
}

export function getConnectionLabel(
  from: CustomToolBlock,
  to: CustomToolBlock,
) {
  if (isControlFlowFoundationBlock(from) || isControlFlowFoundationBlock(to)) {
    return "control flow";
  }

  if (
    isFoundationCustomToolBlockType(from.type) ||
    isFoundationCustomToolBlockType(to.type)
  ) {
    return "model flow";
  }

  if (from.type.startsWith("safety.") || to.type.startsWith("safety.")) {
    return "safety gate";
  }

  if (from.type.startsWith("file.") || to.type.startsWith("file.")) {
    return "file/data flow";
  }

  return "output flow";
}

export function getConnectionClassName(
  from: CustomToolBlock,
  to: CustomToolBlock,
) {
  if (
    from.type.startsWith("safety.") ||
    to.type.startsWith("safety.") ||
    isControlFlowFoundationBlock(from) ||
    isControlFlowFoundationBlock(to)
  ) {
    return "border-dashed";
  }

  return "border-solid";
}