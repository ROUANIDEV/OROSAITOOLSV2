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

export const emptyDataDictionaryWorkspaceState: DataDictionaryWorkspaceState = {
  status: "idle",
  analysis: null,
  exportResult: null,
  error: null,
  lastAnalyzedAt: null,
  lastExportedAt: null,
};

export function normalizeDataDictionaryWorkspaceState(
  state: DataDictionaryWorkspaceState,
): DataDictionaryWorkspaceState {
  return {
    ...emptyDataDictionaryWorkspaceState,
    ...state,
    status:
      state.status === "analyzing" || state.status === "exporting"
        ? state.analysis
          ? "ready"
          : "idle"
        : state.status,
  };
}