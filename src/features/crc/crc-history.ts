import type {
  CrcDraft,
  CrcInputFormat,
} from "@/features/crc/crc-config";
import type { CrcCalculationResult } from "@/lib/crc";

export type CrcHistoryEntry = {
  id: string;
  createdAt: string;

  presetName: string;
  inputFormat: CrcInputFormat;
  payload: string;
  payloadPreview: string;

  draft: CrcDraft;
  result: CrcCalculationResult;
};

const CRC_HISTORY_STORAGE_KEY = "orosaitools.crc.history.v1";
const MAX_HISTORY_ITEMS = 25;
const MAX_STORED_PAYLOAD_CHARS = 100_000;

export function loadCrcHistory(): CrcHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CRC_HISTORY_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isCrcHistoryEntry)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function saveCrcHistory(entries: CrcHistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CRC_HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)),
    );
  } catch {
    // Ignore storage errors.
  }
}

export function addCrcHistoryEntry(
  entries: CrcHistoryEntry[],
  entry: CrcHistoryEntry,
): CrcHistoryEntry[] {
  const nextEntries = [
    entry,
    ...entries.filter((item) => item.id !== entry.id),
  ];

  return nextEntries.slice(0, MAX_HISTORY_ITEMS);
}

export function clearCrcHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CRC_HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function createCrcHistoryEntry({
  presetName,
  inputFormat,
  payload,
  draft,
  result,
}: {
  presetName: string;
  inputFormat: CrcInputFormat;
  payload: string;
  draft: CrcDraft;
  result: CrcCalculationResult;
}): CrcHistoryEntry {
  const safePayload =
    payload.length > MAX_STORED_PAYLOAD_CHARS
      ? payload.slice(0, MAX_STORED_PAYLOAD_CHARS)
      : payload;

  return {
    id: createHistoryId(),
    createdAt: new Date().toISOString(),

    presetName,
    inputFormat,
    payload: safePayload,
    payloadPreview: createPayloadPreview(payload),

    draft,
    result,
  };
}

export function formatCrcHistoryDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function createPayloadPreview(payload: string): string {
  const normalized = payload.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Empty payload";
  }

  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 80)}…`;
}

function createHistoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `crc-history-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isCrcHistoryEntry(value: unknown): value is CrcHistoryEntry {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Partial<CrcHistoryEntry>;

  return (
    typeof record.id === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.presetName === "string" &&
    typeof record.inputFormat === "string" &&
    typeof record.payload === "string" &&
    typeof record.payloadPreview === "string" &&
    record.draft !== null &&
    typeof record.draft === "object" &&
    record.result !== null &&
    typeof record.result === "object"
  );
}