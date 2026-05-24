export type RawRecord = Record<string, unknown>;

export function asRecord(value: unknown): RawRecord {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as RawRecord;
  }

  return {};
}

export function readArray(record: RawRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function readStringArray(record: RawRecord, keys: string[]): string[] {
  return readArray(record, keys)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

export function readString(
  record: RawRecord,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

export function readNumber(
  record: RawRecord,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

export function readBoolean(
  record: RawRecord,
  keys: string[],
  fallback = false,
): boolean {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "yes", "1", "used"].includes(normalized)) {
        return true;
      }

      if (["false", "no", "0", "unused"].includes(normalized)) {
        return false;
      }
    }
  }

  return fallback;
}