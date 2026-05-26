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
} from "@/features/c-project/state/cProjectWorkspaceState";
import {
  DATA_DICTIONARY_WORKSPACE_STORAGE_KEY,
  emptyDataDictionaryWorkspaceState,
  normalizeDataDictionaryWorkspaceState,
  prepareDataDictionaryWorkspaceStateForStorage,
  type DataDictionaryWorkspaceState,
} from "@/features/data-dictionary/data-dictionary-state";
import {
  loadNativePersistedState,
  useDebouncedNativePersistedStateSave,
} from "@/lib/nativePersistedState";

export type WorkspaceState = {
  cProjectState: CProjectWorkspaceState;
  callTreeState: CallTreeWorkspaceState;
  dataDictionaryState: DataDictionaryWorkspaceState;
};

export const emptyWorkspaceState: WorkspaceState = {
  cProjectState: emptyCProjectWorkspaceState,
  callTreeState: emptyCallTreeWorkspaceState,
  dataDictionaryState: emptyDataDictionaryWorkspaceState,
};

export async function loadWorkspaceStateFromDisk(): Promise<WorkspaceState> {
  const [cProjectState, callTreeState, dataDictionaryState] = await Promise.all([
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

  return {
    cProjectState,
    callTreeState,
    dataDictionaryState,
  };
}

type UsePersistWorkspaceStateToDiskArgs = WorkspaceState & {
  enabled: boolean;
};

export function usePersistWorkspaceStateToDisk({
  cProjectState,
  callTreeState,
  dataDictionaryState,
  enabled,
}: UsePersistWorkspaceStateToDiskArgs): void {
  useDebouncedNativePersistedStateSave({
    key: C_PROJECT_WORKSPACE_STORAGE_KEY,
    value: cProjectState,
    enabled,
    prepare: prepareCProjectWorkspaceStateForStorage,
  });

  useDebouncedNativePersistedStateSave({
    key: CALL_TREE_WORKSPACE_STORAGE_KEY,
    value: callTreeState,
    enabled,
    prepare: prepareCallTreeWorkspaceStateForStorage,
  });

  useDebouncedNativePersistedStateSave({
    key: DATA_DICTIONARY_WORKSPACE_STORAGE_KEY,
    value: dataDictionaryState,
    enabled,
    prepare: prepareDataDictionaryWorkspaceStateForStorage,
  });
}