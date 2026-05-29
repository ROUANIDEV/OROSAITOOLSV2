import type {
  DataDictionaryAnalysisResult,
  DataDictionaryExportResult,
} from "@/lib/dataDictionary";

export type DataDictionaryStatus =
  | "idle"
  | "analyzing"
  | "exporting"
  | "ready"
  | "error";

export type DataDictionaryWorkspaceState = {
  status: DataDictionaryStatus;
  analysis: DataDictionaryAnalysisResult | null;
  exportResult: DataDictionaryExportResult | null;
  error: string | null;
  lastAnalyzedAt: string | null;
  lastExportedAt: string | null;
};

export const DATA_DICTIONARY_WORKSPACE_STORAGE_KEY =
  "orosaitools.dataDictionaryWorkspace.v1";

export const emptyDataDictionaryWorkspaceState: DataDictionaryWorkspaceState = {
  status: "idle",
  analysis: null,
  exportResult: null,
  error: null,
  lastAnalyzedAt: null,
  lastExportedAt: null,
};

export function normalizeDataDictionaryWorkspaceState(
  state: Partial<DataDictionaryWorkspaceState> | null | undefined,
): DataDictionaryWorkspaceState {
  const nextState: DataDictionaryWorkspaceState = {
    ...emptyDataDictionaryWorkspaceState,
    ...(state ?? {}),
  };

  return {
    ...nextState,
    status: normalizeDataDictionaryStatus(nextState),
    error: null,
  };
}

export function prepareDataDictionaryWorkspaceStateForStorage(
  state: DataDictionaryWorkspaceState,
): DataDictionaryWorkspaceState {
  const normalizedState = normalizeDataDictionaryWorkspaceState(state);

  return {
    ...normalizedState,
    error: null,
  };
}

function normalizeDataDictionaryStatus(
  state: DataDictionaryWorkspaceState,
): DataDictionaryStatus {
  if (
    state.status === "analyzing" ||
    state.status === "exporting" ||
    state.status === "error"
  ) {
    return state.analysis ? "ready" : "idle";
  }

  if (state.status === "ready" && !state.analysis) {
    return "idle";
  }

  return state.status;
}