import { useEffect, useState } from "react";

import { AppDashboard } from "@/features/dashboard/AppDashboard";
import {
  loadCProjectWorkspaceState,
  saveCProjectWorkspaceState,
  type CProjectWorkspaceState,
} from "@/features/c-project/c-project-state";
import {
  emptyCallTreeWorkspaceState,
  normalizeCallTreeWorkspaceState,
  type CallTreeWorkspaceState,
} from "@/features/call-tree/call-tree-state";
import {
  emptyDataDictionaryWorkspaceState,
  normalizeDataDictionaryWorkspaceState,
  type DataDictionaryWorkspaceState,
} from "@/features/data-dictionary/data-dictionary-state";
import type { ToolId } from "@/features/dashboard/tool-config";
import { loadPersistedState, savePersistedState } from "@/lib/persistedState";

const ACTIVE_TOOL_STORAGE_KEY = "orosaitools.activeTool.v1";
const CALL_TREE_STORAGE_KEY = "orosaitools.callTreeWorkspace.v1";
const DATA_DICTIONARY_STORAGE_KEY = "orosaitools.dataDictionaryWorkspace.v1";

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>(() =>
    loadPersistedState<ToolId>(ACTIVE_TOOL_STORAGE_KEY, "overview"),
  );

  const [cProjectState, setCProjectState] =
    useState<CProjectWorkspaceState>(() => loadCProjectWorkspaceState());

  const [callTreeState, setCallTreeState] = useState<CallTreeWorkspaceState>(
    () =>
      normalizeCallTreeWorkspaceState(
        loadPersistedState(
          CALL_TREE_STORAGE_KEY,
          emptyCallTreeWorkspaceState,
        ),
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

  useEffect(() => {
    savePersistedState(ACTIVE_TOOL_STORAGE_KEY, activeTool);
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