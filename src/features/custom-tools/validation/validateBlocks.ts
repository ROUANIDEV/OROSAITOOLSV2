import type { CustomToolManifest } from "../model/customToolTypes";
import { hasDuplicates, pushValidationMessage } from "./validationHelpers";
import {
  hasTextConfig,
  validateBlockInputReference,
} from "./blockReferenceValidation";
import type { CustomToolValidationMessage } from "./validationTypes";

export function validateBlocks(
  draft: CustomToolManifest,
  messages: CustomToolValidationMessage[],
) {
  const blocks = draft.workflow.blocks;

  if (blocks.length === 0) {
    pushValidationMessage(
      messages,
      "warning",
      "workflow-empty",
      "Workflow has no blocks",
      "Add at least one block before testing this tool.",
    );
  }

  if (hasDuplicates(blocks.map((block) => block.id))) {
    pushValidationMessage(
      messages,
      "error",
      "block-ids-duplicate",
      "Duplicate block IDs",
      "Every workflow block must have a unique internal ID.",
    );
  }

  blocks.forEach((block) => {
    if (!block.label.trim()) {
      pushValidationMessage(
        messages,
        "error",
        `${block.id}-label-empty`,
        "Block label is empty",
        `Block "${block.id}" needs a visible label.`,
      );
    }

    if (block.type === "file.glob") {
      validateBlockInputReference(block, "rootInput", draft.inputs, "folder", messages);

      if (!hasTextConfig(block, "pattern")) {
        pushValidationMessage(
          messages,
          "error",
          `${block.id}-pattern-missing`,
          "Glob pattern is missing",
          `Block "${block.label}" needs a file search pattern.`,
        );
      }
    }

    if (block.type === "file.read") {
      validateBlockInputReference(block, "fileInput", draft.inputs, "file", messages);
    }

    if (block.type === "file.appendText") {
      validateBlockInputReference(block, "targetInput", draft.inputs, "file", messages);
    }

    if (block.type === "text.template" && !hasTextConfig(block, "template")) {
      pushValidationMessage(
        messages,
        "error",
        `${block.id}-template-missing`,
        "Template is missing",
        `Block "${block.label}" needs template text.`,
      );
    }

    if (block.type === "python.code" && !hasTextConfig(block, "code")) {
      pushValidationMessage(
        messages,
        "error",
        `${block.id}-python-code-missing`,
        "Python code is missing",
        `Block "${block.label}" needs Python code.`,
      );
    }
  });
}