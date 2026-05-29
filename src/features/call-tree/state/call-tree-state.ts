import type {
  CallTreeAnalysisResult,
  CallTreeExportResult,
} from "@/lib/callTree";

export type CallTreeStatus =
  | "idle"
  | "analyzing"
  | "exporting"
  | "ready"
  | "error";

export type CallTreeWorkspaceState = {
  status: CallTreeStatus;
  analysis: CallTreeAnalysisResult | null;
  exportResult: CallTreeExportResult | null;
  error: string | null;
  lastAnalyzedAt: string | null;
  lastExportedAt: string | null;
};

export const CALL_TREE_WORKSPACE_STORAGE_KEY =
  "orosaitools.callTreeWorkspace.v1";

export const emptyCallTreeWorkspaceState: CallTreeWorkspaceState = {
  status: "idle",
  analysis: null,
  exportResult: null,
  error: null,
  lastAnalyzedAt: null,
  lastExportedAt: null,
};

export function normalizeCallTreeWorkspaceState(
  state: Partial<CallTreeWorkspaceState> | null | undefined,
): CallTreeWorkspaceState {
  const nextState: CallTreeWorkspaceState = {
    ...emptyCallTreeWorkspaceState,
    ...(state ?? {}),
  };

  return {
    ...nextState,
    status: normalizeCallTreeStatus(nextState),
    error: null,
  };
}

export function prepareCallTreeWorkspaceStateForStorage(
  state: CallTreeWorkspaceState,
): CallTreeWorkspaceState {
  const normalizedState = normalizeCallTreeWorkspaceState(state);

  return {
    ...normalizedState,
    error: null,
  };
}

function normalizeCallTreeStatus(
  state: CallTreeWorkspaceState,
): CallTreeStatus {
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