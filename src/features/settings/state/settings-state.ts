import { deleteAppData } from "@/lib/appDataStorage";

export const SETTINGS_STORAGE_KEY = "orosaitools.settings.v1";

export const WORKSPACE_DATA_CLEARED_EVENT =
  "orosaitools:workspace-data-cleared";

const ACTIVE_TOOL_STORAGE_KEY = "orosaitools.activeTool.v1";

const C_PROJECT_STORAGE_KEY = "orosaitools.cProjectWorkspaceState.v1";
const CALL_TREE_STORAGE_KEY = "orosaitools.callTreeWorkspace.v1";
const DATA_DICTIONARY_STORAGE_KEY = "orosaitools.dataDictionaryWorkspace.v1";

const CRC_HISTORY_STORAGE_KEY = "orosaitools.crc.history.v1";
const CRC_PROFILES_STORAGE_KEY = "orosaitools.crc.profiles.v1";

const WORKSPACE_STORAGE_KEYS = [
  C_PROJECT_STORAGE_KEY,
  CALL_TREE_STORAGE_KEY,
  DATA_DICTIONARY_STORAGE_KEY,
  CRC_HISTORY_STORAGE_KEY,
  CRC_PROFILES_STORAGE_KEY,
] as const;

export type AppSettings = {
  rememberLastTool: boolean;
  autoOpenReportsAfterExport: boolean;
  compactReportCards: boolean;
};

export const defaultSettings: AppSettings = {
  rememberLastTool: true,
  autoOpenReportsAfterExport: false,
  compactReportCards: false,
};

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const settings = value as Partial<AppSettings>;

  return {
    rememberLastTool:
      typeof settings.rememberLastTool === "boolean"
        ? settings.rememberLastTool
        : defaultSettings.rememberLastTool,
    autoOpenReportsAfterExport:
      typeof settings.autoOpenReportsAfterExport === "boolean"
        ? settings.autoOpenReportsAfterExport
        : defaultSettings.autoOpenReportsAfterExport,
    compactReportCards:
      typeof settings.compactReportCards === "boolean"
        ? settings.compactReportCards
        : defaultSettings.compactReportCards,
  };
}

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const rawValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return defaultSettings;
    }

    return normalizeAppSettings(JSON.parse(rawValue));
  } catch {
    return defaultSettings;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSettings = normalizeAppSettings(settings);

  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizedSettings),
    );
  } catch {
    // Ignore localStorage errors.
  }
}

export function clearWorkspaceData(): void {
  clearLegacyWorkspaceLocalStorage();

  void clearNativeWorkspaceData().finally(() => {
    dispatchWorkspaceDataClearedEvent();
  });
}

function clearLegacyWorkspaceLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(ACTIVE_TOOL_STORAGE_KEY);

    for (const key of WORKSPACE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore localStorage errors.
  }
}

async function clearNativeWorkspaceData(): Promise<void> {
  const results = await Promise.allSettled(
    WORKSPACE_STORAGE_KEYS.map((key) => deleteAppData(key)),
  );

  const failedResults = results.filter(
    (result): result is PromiseRejectedResult =>
      result.status === "rejected",
  );

  if (failedResults.length > 0) {
    console.error(
      "Some native workspace data files could not be deleted.",
      failedResults.map((result) => result.reason),
    );
  }
}

function dispatchWorkspaceDataClearedEvent(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(WORKSPACE_DATA_CLEARED_EVENT));
}