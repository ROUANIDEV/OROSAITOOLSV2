import type { TestInputValues } from "./testRunTypes";

export type TemplateRenderContext = {
  inputs: TestInputValues;
  outputs?: Record<string, unknown>;
  extraValues?: Record<string, unknown>;
};

type ValueSource = Record<string, unknown> | undefined;

const templateTokenPattern = /\{\{\s*([^}]+?)\s*\}\}/g;

function stringifyTemplateValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function readPathValue(source: ValueSource, pathParts: string[]) {
  let current: unknown = source;

  for (const part of pathParts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(part);

      if (!Number.isInteger(index)) {
        return undefined;
      }

      current = current[index];
      continue;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function resolveScopedValue(
  expression: string,
  context: TemplateRenderContext,
) {
  const [scope, ...pathParts] = expression.split(".").filter(Boolean);

  if (!scope || pathParts.length === 0) {
    return undefined;
  }

  if (scope === "inputs" || scope === "input") {
    return readPathValue(context.inputs, pathParts);
  }

  if (scope === "outputs" || scope === "output") {
    return readPathValue(context.outputs, pathParts);
  }

  if (scope === "extra" || scope === "extraValues") {
    return readPathValue(context.extraValues, pathParts);
  }

  return undefined;
}

function resolveLegacyValue(
  expression: string,
  context: TemplateRenderContext,
) {
  const inputValue = readPathValue(context.inputs, [expression]);

  if (inputValue !== undefined) {
    return inputValue;
  }

  return readPathValue(context.extraValues, [expression]);
}

function resolveTemplateValue(
  rawExpression: string,
  context: TemplateRenderContext,
) {
  const expression = rawExpression.trim();

  if (!expression) {
    return "";
  }

  const scopedValue = resolveScopedValue(expression, context);

  if (scopedValue !== undefined) {
    return stringifyTemplateValue(scopedValue);
  }

  return stringifyTemplateValue(resolveLegacyValue(expression, context));
}

export function renderTemplate(
  template: string,
  context: TemplateRenderContext,
) {
  return template.replace(templateTokenPattern, (_match, expression: string) => {
    return resolveTemplateValue(expression, context);
  });
}