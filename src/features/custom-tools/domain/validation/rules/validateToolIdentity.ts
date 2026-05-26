import type { CustomToolManifest } from "../../customToolTypes";
import type { CustomToolValidationMessage } from "../model/validationTypes";
import { pushValidationMessage } from "../model/validationHelpers";

export function validateToolIdentity(
  draft: CustomToolManifest,
  messages: CustomToolValidationMessage[],
) {
  if (!draft.name.trim()) {
    pushValidationMessage(
      messages,
      "error",
      "tool-name-required",
      "Tool name is required",
      "Add a clear name before testing or publishing this tool.",
    );
  }

  if (!draft.description.trim()) {
    pushValidationMessage(
      messages,
      "warning",
      "tool-description-required",
      "Description is empty",
      "A short description helps users understand the tool.",
    );
  }
}