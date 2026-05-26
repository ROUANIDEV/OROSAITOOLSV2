import type {
  CustomToolInput,
  CustomToolInputType,
} from "../../model/customToolTypes";
import { createInputId } from "./inputIdUtils";

function createInputLabel(type: CustomToolInputType) {
  if (type === "textarea") {
    return "Long text input";
  }

  if (type === "boolean") {
    return "Yes / No input";
  }

  return `${type.charAt(0).toUpperCase()}${type.slice(1)} input`;
}

export function createCustomToolInput(
  type: CustomToolInputType = "text",
): CustomToolInput {
  return {
    id: createInputId(type),
    label: createInputLabel(type),
    type,
    required: true,
    description: "",
  };
}