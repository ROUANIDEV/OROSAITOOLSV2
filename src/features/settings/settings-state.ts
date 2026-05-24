export const SETTINGS_STORAGE_KEY = "orosaitools.settings.v1";

export const WORKSPACE_DATA_CLEARED_EVENT =
  "orosaitools:workspace-data-cleared";

const ACTIVE_TOOL_STORAGE_KEY = "orosaitools.activeTool.v1";
const C_PROJECT_STORAGE_KEY = "orosaitools.cProjectWorkspaceState.v1";
const CALL_TREE_STORAGE_KEY = "orosaitools.callTreeWorkspace.v1";
const DATA_DICTIONARY_STORAGE_KEY = "orosaitools.dataDictionaryWorkspace.v1";

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
    // Ignore local storage errors.
  }
}

export function clearWorkspaceData(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(ACTIVE_TOOL_STORAGE_KEY);
    window.localStorage.removeItem(C_PROJECT_STORAGE_KEY);
    window.localStorage.removeItem(CALL_TREE_STORAGE_KEY);
    window.localStorage.removeItem(DATA_DICTIONARY_STORAGE_KEY);

    window.dispatchEvent(new CustomEvent(WORKSPACE_DATA_CLEARED_EVENT));
  } catch {
    // Ignore local storage errors.
  }
}