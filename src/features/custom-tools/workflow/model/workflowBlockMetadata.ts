import type {
  CustomToolBlock,
  CustomToolInput,
} from "../../model/customToolTypes";

function formatInputReference(
  inputId: unknown,
  inputs: CustomToolInput[],
  fallback: string,
) {
  if (typeof inputId !== "string" || inputId.length === 0) return fallback;

  const input = inputs.find((candidate) => candidate.id === inputId);

  return input ? `${input.label} (${input.id})` : inputId;
}

export function getBlockInputDetails(
  block: CustomToolBlock,
  inputs: CustomToolInput[],
) {
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
          block.config.sourceInput,
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

export function getConnectionLabel(
  from: CustomToolBlock,
  to: CustomToolBlock,
) {
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
  if (from.type.startsWith("safety.") || to.type.startsWith("safety.")) {
    return "border-dashed";
  }

  return "border-solid";
}