import type {
  CallTreeAnalysisResult,
  CallTreeExportResult,
} from "@/lib/callTree";

export type CallTreeStatus = "idle" | "analyzing" | "exporting" | "ready" | "error";

export type CallTreeWorkspaceState = {
  status: CallTreeStatus;
  analysis: CallTreeAnalysisResult | null;
  exportResult: CallTreeExportResult | null;
  error: string | null;
  lastAnalyzedAt: string | null;
  lastExportedAt: string | null;
};

export const emptyCallTreeWorkspaceState: CallTreeWorkspaceState = {
  status: "idle",
  analysis: null,
  exportResult: null,
  error: null,
  lastAnalyzedAt: null,
  lastExportedAt: null,
};

export function normalizeCallTreeWorkspaceState(
  state: CallTreeWorkspaceState,
): CallTreeWorkspaceState {
  return {
    ...emptyCallTreeWorkspaceState,
    ...state,
    status:
      state.status === "analyzing" || state.status === "exporting"
        ? state.analysis
          ? "ready"
          : "idle"
        : state.status,
  };
}