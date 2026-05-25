import type { CustomToolManifest } from "../model/customToolTypes";
import { countValidationMessages } from "./validationHelpers";
import type {
  CustomToolValidationMessage,
  CustomToolValidationResult,
} from "./validationTypes";
import { validateBlocks } from "./validateBlocks";
import { validateInputs } from "./validateInputs";
import { validatePermissions } from "./validatePermissions";
import { validateToolIdentity } from "./validateToolIdentity";

export type {
  CustomToolValidationMessage,
  CustomToolValidationResult,
  ValidationSeverity,
} from "./validationTypes";

export function validateCustomToolDraft(
  draft: CustomToolManifest,
): CustomToolValidationResult {
  const messages: CustomToolValidationMessage[] = [];

  validateToolIdentity(draft, messages);
  validateInputs(draft, messages);
  validateBlocks(draft, messages);
  validatePermissions(draft, messages);

  const errorCount = countValidationMessages(messages, "error");
  const warningCount = countValidationMessages(messages, "warning");

  return {
    messages,
    errorCount,
    warningCount,
    canPublish: errorCount === 0,
  };
}