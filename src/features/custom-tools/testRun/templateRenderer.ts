import type { TestInputValues } from "./testRunTypes";

type TemplateContext = {
  inputs: TestInputValues;
  extraValues: Record<string, unknown>;
};

function stringifyValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value == null) {
    return "";
  }

  return JSON.stringify(value);
}

export function renderTemplate(template: string, context: TemplateContext) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
    if (key in context.inputs) {
      return stringifyValue(context.inputs[key]);
    }

    if (key in context.extraValues) {
      return stringifyValue(context.extraValues[key]);
    }

    return "";
  });
}