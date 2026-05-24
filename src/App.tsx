import { useEffect, useRef, useState } from "react";

import {
  emptyCallTreeWorkspaceState,
  normalizeCallTreeWorkspaceState,
  type CallTreeWorkspaceState,
} from "@/features/call-tree/call-tree-state";
import {
  emptyCProjectWorkspaceState,
  loadCProjectWorkspaceState,
  saveCProjectWorkspaceState,
  type CProjectWorkspaceState,
} from "@/features/c-project/c-project-state";
import { AppDashboard } from "@/features/dashboard/AppDashboard";
import { isToolId, tools, type ToolId } from "@/features/dashboard/tool-config";
import {
  emptyDataDictionaryWorkspaceState,
  normalizeDataDictionaryWorkspaceState,
  type DataDictionaryWorkspaceState,
} from "@/features/data-dictionary/data-dictionary-state";
import {
  loadAppSettings,
  WORKSPACE_DATA_CLEARED_EVENT,
} from "@/features/settings/settings-state";
import { loadPersistedState, savePersistedState } from "@/lib/persistedState";

const ACTIVE_TOOL_STORAGE_KEY = "orosaitools.activeTool.v1";
const CALL_TREE_STORAGE_KEY = "orosaitools.callTreeWorkspace.v1";
const DATA_DICTIONARY_STORAGE_KEY = "orosaitools.dataDictionaryWorkspace.v1";

function loadActiveTool(): ToolId {
  if (typeof window === "undefined") {
    return "overview";
  }

  const settings = loadAppSettings();

  if (!settings.rememberLastTool) {
    return "overview";
  }

  try {
    const rawValue = window.localStorage.getItem(ACTIVE_TOOL_STORAGE_KEY);

    if (!rawValue) {
      return "overview";
    }

    const parsedValue = JSON.parse(rawValue);

    return isToolId(parsedValue) ? parsedValue : "overview";
  } catch {
    return "overview";
  }
}

function saveActiveTool(activeTool: ToolId): void {
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
    // Ignore local storage errors.
  }
}

function getToolTitle(toolId: ToolId): string {
  return tools.find((tool) => tool.id === toolId)?.title ?? "Dashboard";
}

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>(() => loadActiveTool());

  const [cProjectState, setCProjectState] =
    useState<CProjectWorkspaceState>(() => loadCProjectWorkspaceState());

  const [callTreeState, setCallTreeState] = useState<CallTreeWorkspaceState>(
    () =>
      normalizeCallTreeWorkspaceState(
        loadPersistedState(CALL_TREE_STORAGE_KEY, emptyCallTreeWorkspaceState),
      ),
  );

  const [dataDictionaryState, setDataDictionaryState] =
    useState<DataDictionaryWorkspaceState>(() =>
      normalizeDataDictionaryWorkspaceState(
        loadPersistedState(
          DATA_DICTIONARY_STORAGE_KEY,
          emptyDataDictionaryWorkspaceState,
        ),
      ),
    );

  const lastCallTreeExportRef = useRef(callTreeState.lastExportedAt);

  const lastDataDictionaryExportRef = useRef(
    dataDictionaryState.lastExportedAt,
  );

  useEffect(() => {
    function handleWorkspaceDataCleared() {
      lastCallTreeExportRef.current = null;
      lastDataDictionaryExportRef.current = null;

      setActiveTool("overview");
      setCProjectState(emptyCProjectWorkspaceState);
      setCallTreeState(emptyCallTreeWorkspaceState);
      setDataDictionaryState(emptyDataDictionaryWorkspaceState);
    }

    window.addEventListener(
      WORKSPACE_DATA_CLEARED_EVENT,
      handleWorkspaceDataCleared,
    );

    return () => {
      window.removeEventListener(
        WORKSPACE_DATA_CLEARED_EVENT,
        handleWorkspaceDataCleared,
      );
    };
  }, []);

  useEffect(() => {
    document.title = `OROSAITOOLS · ${getToolTitle(activeTool)}`;
  }, [activeTool]);

  useEffect(() => {
    saveActiveTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    saveCProjectWorkspaceState(cProjectState);
  }, [cProjectState]);

  useEffect(() => {
    savePersistedState(
      CALL_TREE_STORAGE_KEY,
      normalizeCallTreeWorkspaceState(callTreeState),
    );
  }, [callTreeState]);

  useEffect(() => {
    savePersistedState(
      DATA_DICTIONARY_STORAGE_KEY,
      normalizeDataDictionaryWorkspaceState(dataDictionaryState),
    );
  }, [dataDictionaryState]);

  useEffect(() => {
    const previousCallTreeExport = lastCallTreeExportRef.current;
    const previousDataDictionaryExport = lastDataDictionaryExportRef.current;

    const currentCallTreeExport = callTreeState.lastExportedAt;
    const currentDataDictionaryExport = dataDictionaryState.lastExportedAt;

    lastCallTreeExportRef.current = currentCallTreeExport;
    lastDataDictionaryExportRef.current = currentDataDictionaryExport;

    const settings = loadAppSettings();

    if (!settings.autoOpenReportsAfterExport) {
      return;
    }

    const callTreeWasExported =
      Boolean(currentCallTreeExport) &&
      currentCallTreeExport !== previousCallTreeExport;

    const dataDictionaryWasExported =
      Boolean(currentDataDictionaryExport) &&
      currentDataDictionaryExport !== previousDataDictionaryExport;

    if (
      activeTool !== "reports" &&
      (callTreeWasExported || dataDictionaryWasExported)
    ) {
      setActiveTool("reports");
    }
  }, [
    activeTool,
    callTreeState.lastExportedAt,
    dataDictionaryState.lastExportedAt,
  ]);

  return (
    <AppDashboard
      activeTool={activeTool}
      onToolChange={setActiveTool}
      cProjectState={cProjectState}
      onCProjectStateChange={setCProjectState}
      callTreeState={callTreeState}
      onCallTreeStateChange={setCallTreeState}
      dataDictionaryState={dataDictionaryState}
      onDataDictionaryStateChange={setDataDictionaryState}
    />
  );
}