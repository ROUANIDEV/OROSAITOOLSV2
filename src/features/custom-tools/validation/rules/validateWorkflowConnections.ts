import type { CustomToolManifest } from "../../model/customToolTypes";
import { resolveVisualWorkflowOrder } from "../../workflow/resolveVisualWorkflowOrder";
import type { CustomToolValidationMessage } from "../model/validationTypes";

export function validateWorkflowConnections(
  draft: CustomToolManifest,
): CustomToolValidationMessage[] {
  const messages: CustomToolValidationMessage[] = [];
  const resolvedWorkflowOrder = resolveVisualWorkflowOrder(draft);

  if (!resolvedWorkflowOrder.usedVisualConnections) {
    return messages;
  }

  resolvedWorkflowOrder.messages.forEach((message, index) => {
    if (message.level === "info") return;

    messages.push({
      id: `workflow-visual-order-${message.level}-${index}`,
      severity: message.level === "error" ? "error" : "warning",
      title:
        message.level === "error"
          ? "Visual workflow order is invalid"
          : "Visual workflow order warning",
      description: message.message,
    });
  });

  return messages;
}