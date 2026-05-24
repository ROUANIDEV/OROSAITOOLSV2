import { useEffect, useRef, useState } from "react";

import {
  CALL_TREE_WORKSPACE_STORAGE_KEY,
  emptyCallTreeWorkspaceState,
  normalizeCallTreeWorkspaceState,
  prepareCallTreeWorkspaceStateForStorage,
  type CallTreeWorkspaceState,
} from "@/features/call-tree/call-tree-state";
import {
  C_PROJECT_WORKSPACE_STORAGE_KEY,
  emptyCProjectWorkspaceState,
  normalizeCProjectWorkspaceState,
  prepareCProjectWorkspaceStateForStorage,
  type CProjectWorkspaceState,
} from "@/features/c-project/c-project-state";
import { AppDashboard } from "@/features/dashboard/AppDashboard";
import { isToolId, tools, type ToolId } from "@/features/dashboard/tool-config";
import {
  DATA_DICTIONARY_WORKSPACE_STORAGE_KEY,
  emptyDataDictionaryWorkspaceState,
  normalizeDataDictionaryWorkspaceState,
  prepareDataDictionaryWorkspaceStateForStorage,
  type DataDictionaryWorkspaceState,
} from "@/features/data-dictionary/data-dictionary-state";
import {
  loadAppSettings,
  WORKSPACE_DATA_CLEARED_EVENT,
} from "@/features/settings/settings-state";
import {
  loadNativePersistedState,
  useDebouncedNativePersistedStateSave,
} from "@/lib/nativePersistedState";

const ACTIVE_TOOL_STORAGE_KEY = "orosaitools.activeTool.v1";

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
    // Ignore localStorage errors.
  }
}

function getToolTitle(toolId: ToolId): string {
  return tools.find((tool) => tool.id === toolId)?.title ?? "Dashboard";
}

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>(() => loadActiveTool());

  const [workspaceStateLoaded, setWorkspaceStateLoaded] = useState(false);

  const [cProjectState, setCProjectState] = useState<CProjectWorkspaceState>(
    emptyCProjectWorkspaceState,
  );

  const [callTreeState, setCallTreeState] = useState<CallTreeWorkspaceState>(
    emptyCallTreeWorkspaceState,
  );

  const [dataDictionaryState, setDataDictionaryState] =
    useState<DataDictionaryWorkspaceState>(emptyDataDictionaryWorkspaceState);

  const lastCallTreeExportRef = useRef(callTreeState.lastExportedAt);

  const lastDataDictionaryExportRef = useRef(
    dataDictionaryState.lastExportedAt,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceState() {
      const [
        loadedCProjectState,
        loadedCallTreeState,
        loadedDataDictionaryState,
      ] = await Promise.all([
        loadNativePersistedState({
          key: C_PROJECT_WORKSPACE_STORAGE_KEY,
          fallback: emptyCProjectWorkspaceState,
          normalize: normalizeCProjectWorkspaceState,
        }),
        loadNativePersistedState({
          key: CALL_TREE_WORKSPACE_STORAGE_KEY,
          fallback: emptyCallTreeWorkspaceState,
          normalize: normalizeCallTreeWorkspaceState,
        }),
        loadNativePersistedState({
          key: DATA_DICTIONARY_WORKSPACE_STORAGE_KEY,
          fallback: emptyDataDictionaryWorkspaceState,
          normalize: normalizeDataDictionaryWorkspaceState,
        }),
      ]);

      if (!isMounted) {
        return;
      }

      setCProjectState(loadedCProjectState);
      setCallTreeState(loadedCallTreeState);
      setDataDictionaryState(loadedDataDictionaryState);

      lastCallTreeExportRef.current = loadedCallTreeState.lastExportedAt;
      lastDataDictionaryExportRef.current =
        loadedDataDictionaryState.lastExportedAt;

      setWorkspaceStateLoaded(true);
    }

    void loadWorkspaceState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleWorkspaceDataCleared() {
      lastCallTreeExportRef.current = null;
      lastDataDictionaryExportRef.current = null;

      setActiveTool("overview");
      setCProjectState(emptyCProjectWorkspaceState);
      setCallTreeState(emptyCallTreeWorkspaceState);
      setDataDictionaryState(emptyDataDictionaryWorkspaceState);
      setWorkspaceStateLoaded(true);
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

  useDebouncedNativePersistedStateSave({
    key: C_PROJECT_WORKSPACE_STORAGE_KEY,
    value: cProjectState,
    enabled: workspaceStateLoaded,
    prepare: prepareCProjectWorkspaceStateForStorage,
  });

  useDebouncedNativePersistedStateSave({
    key: CALL_TREE_WORKSPACE_STORAGE_KEY,
    value: callTreeState,
    enabled: workspaceStateLoaded,
    prepare: prepareCallTreeWorkspaceStateForStorage,
  });

  useDebouncedNativePersistedStateSave({
    key: DATA_DICTIONARY_WORKSPACE_STORAGE_KEY,
    value: dataDictionaryState,
    enabled: workspaceStateLoaded,
    prepare: prepareDataDictionaryWorkspaceStateForStorage,
  });

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