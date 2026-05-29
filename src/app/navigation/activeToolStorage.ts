import { DEFAULT_TOOL_ID, isToolId, ToolId } from "@/features/dashboard";
import { loadAppSettings } from "@/features/settings";

const ACTIVE_TOOL_STORAGE_KEY = "orosaitools.activeTool.v1";

export function loadActiveTool(): ToolId {
  if (typeof window === "undefined") {
    return DEFAULT_TOOL_ID;
  }

  const settings = loadAppSettings();

  if (!settings.rememberLastTool) {
    return DEFAULT_TOOL_ID;
  }

  try {
    const rawValue = window.localStorage.getItem(ACTIVE_TOOL_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_TOOL_ID;
    }

    const parsedValue = JSON.parse(rawValue);

    return isToolId(parsedValue) ? parsedValue : DEFAULT_TOOL_ID;
  } catch {
    return DEFAULT_TOOL_ID;
  }
}

export function saveActiveTool(activeTool: ToolId): void {
  if (typeof window === "undefined") {
    return;
  }

  const settings = loadAppSettings();

  try {
    if (!settings.rememberLastTool) {
      window.localStorage.removeItem(ACTIVE_TOOL_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      ACTIVE_TOOL_STORAGE_KEY,
      JSON.stringify(activeTool),
    );
  } catch {
    // Ignore localStorage errors.
  }
}