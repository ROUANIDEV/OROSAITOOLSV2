import type { RawRecord } from "@/features/call-tree/graph/callTreeGraphTypes";

export function asRecord(value: unknown): RawRecord {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as RawRecord;
  }

  return {};
}

export function readArray(record: RawRecord, keys: string[]): unknown[] {
  const normalizedKeys = getNormalizedKeys(record);

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function readString(
  record: RawRecord,
  keys: string[],
  fallback = "",
): string {
  const normalizedKeys = getNormalizedKeys(record);

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
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
  const normalizedKeys = getNormalizedKeys(record);

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

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
  const normalizedKeys = getNormalizedKeys(record);

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "yes", "1", "root"].includes(normalized)) {
        return true;
      }

      if (["false", "no", "0"].includes(normalized)) {
        return false;
      }
    }
  }

  return fallback;
}

export function cleanText(value: string): string {
  return value.trim();
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleanValue = cleanText(value);

    if (!cleanValue || seen.has(cleanValue)) {
      continue;
    }

    seen.add(cleanValue);
    result.push(cleanValue);
  }

  return result;
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function slugify(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getNormalizedKeys(record: RawRecord): Map<string, string> {
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  return normalizedKeys;
}

function normalizeKey(value: string): string {
  return value.replace(/[_\-\s]/g, "").toLowerCase();
}