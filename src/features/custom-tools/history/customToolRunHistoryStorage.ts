import { invoke } from "@tauri-apps/api/core";

import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import type {
  CustomToolRunHistoryData,
  CustomToolRunHistoryEntry,
} from "./customToolRunHistoryTypes";

const RUN_HISTORY_KEY = "custom_tools.run_history";
const MAX_HISTORY_ENTRIES = 30;

type AppDataDocument<TData> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: TData;
};

function createEmptyRunHistoryData(): CustomToolRunHistoryData {
  return {
    entries: [],
  };
}

function newestFirst(
  entries: CustomToolRunHistoryEntry[],
): CustomToolRunHistoryEntry[] {
  return [...entries].sort((left, right) => {
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}

export async function loadCustomToolRunHistory(toolId?: string) {
  try {
    const document = await invoke<AppDataDocument<CustomToolRunHistoryData> | null>(
      tauriCommandNames.appDataRead,
      {
        key: RUN_HISTORY_KEY,
      },
    );

    const entries = document?.data.entries ?? [];

    if (!toolId) {
      return newestFirst(entries);
    }

    return newestFirst(entries.filter((entry) => entry.toolId === toolId));
  } catch (error) {
    console.info("[custom-tools-history] No run history found.", error);
    return [];
  }
}

export async function saveCustomToolRunHistory(
  entries: CustomToolRunHistoryEntry[],
) {
  await invoke<AppDataDocument<CustomToolRunHistoryData>>(
    tauriCommandNames.appDataWrite,
    {
      key: RUN_HISTORY_KEY,
      data: {
        ...createEmptyRunHistoryData(),
        entries: newestFirst(entries).slice(0, MAX_HISTORY_ENTRIES),
      },
    },
  );
}

export async function addCustomToolRunHistoryEntry(
  entry: CustomToolRunHistoryEntry,
) {
  const entries = await loadCustomToolRunHistory();
  await saveCustomToolRunHistory([entry, ...entries]);
}