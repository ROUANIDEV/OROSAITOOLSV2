import type { CustomToolManifest } from "../model/customToolTypes";
import { pushValidationMessage } from "./validationHelpers";
import type { CustomToolValidationMessage } from "./validationTypes";

export function validatePermissions(
  draft: CustomToolManifest,
  messages: CustomToolValidationMessage[],
) {
  const blockTypes = draft.workflow.blocks.map((block) => block.type);
  const hasFileBlock = blockTypes.some((type) => type.startsWith("file."));

  if (hasFileBlock && !draft.permissions.fileRead) {
    pushValidationMessage(
      messages,
      "warning",
      "file-read-permission-disabled",
      "File read permission is disabled",
      "File blocks usually need file read permission enabled.",
    );
  }

  if (blockTypes.includes("file.appendText") && !draft.permissions.fileWrite) {
    pushValidationMessage(
      messages,
      "warning",
      "file-write-permission-disabled",
      "File write permission is disabled",
      "Append blocks need file write permission before real runs.",
    );
  }

  if (blockTypes.includes("python.code") && !draft.permissions.python) {
    pushValidationMessage(
      messages,
      "warning",
      "python-permission-disabled",
      "Python permission is disabled",
      "Python blocks need explicit permission before execution.",
    );
  }
}