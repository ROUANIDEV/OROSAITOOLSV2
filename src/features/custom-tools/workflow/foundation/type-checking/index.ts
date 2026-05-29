import type { FoundationDataType } from "../foundationBlockTypes";

export type FoundationRuntimeValueKind =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "dictionary"
  | "null"
  | "undefined"
  | "unknown";

export type FoundationTypedValueCheck = {
  ok: boolean;
  expectedType: FoundationDataType;
  actualKind: FoundationRuntimeValueKind;
  normalizedValue: unknown;
  message?: string;
};

const numericPattern = /^-?(?:\d+|\d*\.\d+)(?:e[+-]?\d+)?$/i;

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function getFoundationRuntimeValueKind(
  value: unknown,
): FoundationRuntimeValueKind {
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "dictionary";

  return "unknown";
}

function normalizeNumberValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || !numericPattern.test(trimmed)) return undefined;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeBooleanValue(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return undefined;
}

function normalizeArrayValue(value: unknown) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (Array.isArray(parsed)) return parsed;
  }

  return undefined;
}

function normalizeDictionaryValue(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = tryParseJson(value);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeJsonValue(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";

  const parsed = tryParseJson(trimmed);
  return typeof parsed === "undefined" ? value : parsed;
}

function typeLabel(value: unknown) {
  const kind = getFoundationRuntimeValueKind(value);

  if (kind === "string") {
    const trimmed = String(value).trim();
    if (numericPattern.test(trimmed)) return "numeric string";
    if (["true", "false"].includes(trimmed.toLowerCase())) {
      return "boolean string";
    }
  }

  return kind;
}

export function checkFoundationTypedValue(
  expectedType: FoundationDataType | string | undefined,
  value: unknown,
): FoundationTypedValueCheck {
  const normalizedExpectedType =
    typeof expectedType === "string" && expectedType.length > 0
      ? (expectedType as FoundationDataType)
      : "unknown";

  if (normalizedExpectedType === "unknown") {
    return {
      ok: true,
      expectedType: "unknown",
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue: value,
    };
  }

  if (normalizedExpectedType === "void") {
    const ok =
      typeof value === "undefined" ||
      value === null ||
      (typeof value === "string" && value.trim().length === 0);

    return {
      ok,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue: undefined,
      message: ok
        ? undefined
        : `Expected void/empty value, but received ${typeLabel(value)}.`,
    };
  }

  if (normalizedExpectedType === "string") {
    return {
      ok: typeof value === "string",
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue: typeof value === "string" ? value : String(value ?? ""),
      message:
        typeof value === "string"
          ? undefined
          : `Expected string, but received ${typeLabel(value)}.`,
    };
  }

  if (normalizedExpectedType === "number") {
    const normalizedValue = normalizeNumberValue(value);
    const ok = typeof normalizedValue === "number";

    return {
      ok,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue,
      message: ok
        ? undefined
        : `Expected number, but received ${typeLabel(value)}. Use a value like 15 or 15.5, not text like "${String(
            value,
          )}".`,
    };
  }

  if (normalizedExpectedType === "boolean") {
    const normalizedValue = normalizeBooleanValue(value);
    const ok = typeof normalizedValue === "boolean";

    return {
      ok,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue,
      message: ok
        ? undefined
        : `Expected boolean, but received ${typeLabel(value)}. Use true or false.`,
    };
  }

  if (normalizedExpectedType === "array" || normalizedExpectedType === "list") {
    const normalizedValue = normalizeArrayValue(value);
    const ok = Array.isArray(normalizedValue);

    return {
      ok,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue,
      message: ok
        ? undefined
        : `Expected ${normalizedExpectedType}, but received ${typeLabel(
            value,
          )}. Use JSON array syntax like ["a", "b"].`,
    };
  }

  if (
    normalizedExpectedType === "dictionary" ||
    normalizedExpectedType === "object"
  ) {
    const normalizedValue = normalizeDictionaryValue(value);
    const ok = Boolean(normalizedValue);

    return {
      ok,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue,
      message: ok
        ? undefined
        : `Expected ${normalizedExpectedType}, but received ${typeLabel(
            value,
          )}. Use JSON object syntax like {"key":"value"}.`,
    };
  }

  if (normalizedExpectedType === "json") {
    return {
      ok: true,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue: normalizeJsonValue(value),
    };
  }

  if (normalizedExpectedType === "file" || normalizedExpectedType === "folder") {
    const ok = typeof value === "string" && value.trim().length > 0;

    return {
      ok,
      expectedType: normalizedExpectedType,
      actualKind: getFoundationRuntimeValueKind(value),
      normalizedValue: typeof value === "string" ? value : "",
      message: ok
        ? undefined
        : `Expected ${normalizedExpectedType} path string, but received ${typeLabel(
            value,
          )}.`,
    };
  }

  return {
    ok: true,
    expectedType: normalizedExpectedType,
    actualKind: getFoundationRuntimeValueKind(value),
    normalizedValue: value,
  };
}

export function foundationValueMatchesDataType(
  expectedType: FoundationDataType | string | undefined,
  value: unknown,
): boolean {
  return checkFoundationTypedValue(expectedType, value).ok;
}

export function normalizeFoundationTypedValue(
  expectedType: FoundationDataType | string | undefined,
  value: unknown,
): unknown {
  return checkFoundationTypedValue(expectedType, value).normalizedValue;
}

export function rustTypeForFoundationDataType(
  dataType: FoundationDataType | string | undefined,
): string {
  switch (dataType) {
    case "string":
    case "file":
    case "folder":
      return "String";
    case "number":
      return "f64";
    case "boolean":
      return "bool";
    case "array":
    case "list":
      return "Vec<Value>";
    case "dictionary":
    case "object":
    case "json":
    case "unknown":
    default:
      return "serde_json::Value";
    case "void":
      return "()";
  }
}

function escapeRustString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export function rustLiteralForFoundationValue(
  expectedType: FoundationDataType | string | undefined,
  value: unknown,
): string {
  const check = checkFoundationTypedValue(expectedType, value);

  if (!check.ok) {
    return `/* invalid ${check.expectedType}: ${String(value)} */`;
  }

  switch (check.expectedType) {
    case "string":
    case "file":
    case "folder":
      return `"${escapeRustString(String(check.normalizedValue ?? ""))}".to_string()`;
    case "number":
      return String(check.normalizedValue);
    case "boolean":
      return String(check.normalizedValue);
    case "array":
    case "list":
    case "dictionary":
    case "object":
    case "json":
    case "unknown":
      return `serde_json::json!(${JSON.stringify(check.normalizedValue ?? null)})`;
    case "void":
      return "()";
    default:
      return `serde_json::json!(${JSON.stringify(check.normalizedValue ?? null)})`;
  }
}
