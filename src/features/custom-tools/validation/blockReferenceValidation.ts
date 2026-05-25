import type {
  CustomToolBlock,
  CustomToolInput,
  CustomToolInputType,
} from "../model/customToolTypes";
import { pushValidationMessage } from "./validationHelpers";
import type { CustomToolValidationMessage } from "./validationTypes";

function getTextConfig(block: CustomToolBlock, key: string) {
  const value = block.config[key];

  return typeof value === "string" ? value.trim() : "";
}

export function validateBlockInputReference(
  block: CustomToolBlock,
  key: string,
  inputs: CustomToolInput[],
  expectedType: CustomToolInputType,
  messages: CustomToolValidationMessage[],
) {
  const value = getTextConfig(block, key);

  if (!value) {
    pushValidationMessage(
      messages,
      "error",
      `${block.id}-${key}-missing`,
      `Missing ${key}`,
      `Block "${block.label}" needs a "${key}" config value.`,
    );

    return;
  }

  const input = inputs.find((item) => item.id === value);

  if (!input) {
    pushValidationMessage(
      messages,
      "error",
      `${block.id}-${key}-unknown`,
      "Unknown input reference",
      `Block "${block.label}" references input "${value}", but it does not exist.`,
    );

    return;
  }

  if (input.type !== expectedType) {
    pushValidationMessage(
      messages,
      "error",
      `${block.id}-${key}-wrong-type`,
      "Wrong input type",
      `Block "${block.label}" expects "${value}" to be a ${expectedType} input, but it is ${input.type}.`,
    );
  }
}

export function hasTextConfig(block: CustomToolBlock, key: string) {
  return getTextConfig(block, key).length > 0;
}