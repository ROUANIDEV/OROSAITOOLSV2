import type { CustomToolManifest } from "../model/customToolTypes";
import { hasDuplicates, isSafeInputId, pushValidationMessage } from "./validationHelpers";
import type { CustomToolValidationMessage } from "./validationTypes";

export function validateInputs(
  draft: CustomToolManifest,
  messages: CustomToolValidationMessage[],
) {
  if (draft.inputs.length === 0) {
    pushValidationMessage(
      messages,
      "warning",
      "inputs-empty",
      "No inputs defined",
      "Most custom tools need at least one user input.",
    );
  }

  if (hasDuplicates(draft.inputs.map((input) => input.id))) {
    pushValidationMessage(
      messages,
      "error",
      "input-ids-duplicate",
      "Duplicate input IDs",
      "Every input must have a unique internal ID.",
    );
  }

  draft.inputs.forEach((input) => {
    if (!input.id.trim()) {
      pushValidationMessage(
        messages,
        "error",
        `input-${input.label}-id-empty`,
        "Input ID is empty",
        `Input "${input.label}" needs an internal ID.`,
      );
    }

    if (input.id.trim() && !isSafeInputId(input.id)) {
      pushValidationMessage(
        messages,
        "error",
        `input-${input.id}-id-invalid`,
        "Input ID has invalid characters",
        `Input ID "${input.id}" must start with a letter and use only letters, numbers, "_" or "-".`,
      );
    }

    if (!input.label.trim()) {
      pushValidationMessage(
        messages,
        "error",
        `input-${input.id}-label-empty`,
        "Input label is empty",
        `Input "${input.id}" needs a visible label.`,
      );
    }
  });
}