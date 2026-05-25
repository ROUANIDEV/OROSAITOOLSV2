import type { CustomToolManifest } from "../model/customToolTypes";
import type {
  CustomToolValidationMessage,
  CustomToolValidationResult,
} from "./validationTypes";
import { validateBlocks } from "./validateBlocks";
import { validateInputs } from "./validateInputs";
import { validatePermissions } from "./validatePermissions";
import { validateToolIdentity } from "./validateToolIdentity";
import { validateWorkflowConnections } from "./validateWorkflowConnections";

export type {
  CustomToolValidationMessage,
  CustomToolValidationResult,
  ValidationSeverity,
} from "./validationTypes";

function countMessagesBySeverity(
  messages: CustomToolValidationMessage[],
  severity: "error" | "warning",
) {
  return messages.filter((message) => message.severity === severity).length;
}

function mapPermissionIssuesToValidationMessages(
  draft: CustomToolManifest,
): CustomToolValidationMessage[] {
  return validatePermissions(draft).map((issue) => {
    return {
      id: issue.id,
      severity: issue.level,
      title:
        issue.level === "error"
          ? "Permission configuration error"
          : "Permission configuration warning",
      description: issue.message,
    };
  });
}

export function validateCustomToolDraft(
  draft: CustomToolManifest,
): CustomToolValidationResult {
  const messages: CustomToolValidationMessage[] = [];

  validateToolIdentity(draft, messages);
  validateInputs(draft, messages);
  validateBlocks(draft, messages);
  messages.push(...validateWorkflowConnections(draft));
  messages.push(...mapPermissionIssuesToValidationMessages(draft));

  const errorCount = countMessagesBySeverity(messages, "error");
  const warningCount = countMessagesBySeverity(messages, "warning");

  return {
    messages,
    errorCount,
    warningCount,
    canPublish: errorCount === 0,
  };
}