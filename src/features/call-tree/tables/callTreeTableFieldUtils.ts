export function getTextField(row: unknown, keys: string[]): string {
  if (typeof row === "string" || typeof row === "number") {
    return String(row);
  }

  const value = getRawField(row, keys);

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const nestedName = getRawField(value, [
      "name",
      "functionName",
      "function_name",
      "label",
      "id",
      "path",
      "relativePath",
      "relative_path",
    ]);

    if (nestedName !== null && nestedName !== undefined && nestedName !== "") {
      return String(nestedName);
    }
  }

  return String(value);
}

export function getNumberOrTextField(
  row: unknown,
  keys: string[],
): string | number {
  const value = getRawField(row, keys);

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "—";
}

export function getRawField(row: unknown, keys: string[]): unknown {
  if (!row || typeof row !== "object") {
    return undefined;
  }

  const record = row as Record<string, unknown>;
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function normalizeKey(value: string): string {
  return value.replace(/[_\-\s]/g, "").toLowerCase();
}