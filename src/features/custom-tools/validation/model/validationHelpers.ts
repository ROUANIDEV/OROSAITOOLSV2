import type {
  CustomToolValidationMessage,
  ValidationSeverity,
} from "./validationTypes";

export function pushValidationMessage(
  messages: CustomToolValidationMessage[],
  severity: ValidationSeverity,
  id: string,
  title: string,
  description: string,
) {
  messages.push({
    id,
    severity,
    title,
    description,
  });
}

export function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

export function countValidationMessages(
  messages: CustomToolValidationMessage[],
  severity: ValidationSeverity,
) {
  return messages.filter((message) => message.severity === severity).length;
}

export function isSafeInputId(inputId: string) {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(inputId);
}