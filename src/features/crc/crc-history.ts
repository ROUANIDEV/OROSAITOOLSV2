import type { CrcDraft, CrcInputFormat } from "@/features/crc/crc-config";
import { deleteAppData, readAppData, writeAppData } from "@/lib/appDataStorage";
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

export const CRC_HISTORY_STORAGE_KEY = "orosaitools.crc.history.v1";

const MAX_HISTORY_ITEMS = 25;
const MAX_STORED_PAYLOAD_CHARS = 100_000;

export async function loadCrcHistory(): Promise<CrcHistoryEntry[]> {
  try {
    const value = await readAppData<unknown>(CRC_HISTORY_STORAGE_KEY);
    return normalizeCrcHistory(value);
  } catch (error) {
    console.error("Failed to read native CRC history.", error);
    return [];
  }
}

export async function saveCrcHistory(
  entries: CrcHistoryEntry[],
): Promise<void> {
  const normalizedEntries = normalizeCrcHistory(entries);

  try {
    await writeAppData(CRC_HISTORY_STORAGE_KEY, normalizedEntries);
  } catch (error) {
    console.error("Failed to save CRC history in native app data.", error);
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

export async function clearCrcHistory(): Promise<void> {
  try {
    await deleteAppData(CRC_HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear native CRC history.", error);
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

function normalizeCrcHistory(value: unknown): CrcHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isCrcHistoryEntry).slice(0, MAX_HISTORY_ITEMS);
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