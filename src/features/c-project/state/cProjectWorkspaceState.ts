import type { CProjectScanSummary, CscFolder } from "@/lib/cProject";

export type CProjectScanStatus = "idle" | "scanning" | "ready" | "error";

export type CProjectWorkspaceState = {
  projectPath: string;
  summary: CProjectScanSummary | null;
  cscFolders: CscFolder[];
  selectedCscPath: string | null;
  status: CProjectScanStatus;
  error: string | null;
  lastScannedAt: string | null;
};

export const C_PROJECT_WORKSPACE_STORAGE_KEY =
  "orosaitools.cProjectWorkspaceState.v1";

export const emptyCProjectWorkspaceState: CProjectWorkspaceState = {
  projectPath: "",
  summary: null,
  cscFolders: [],
  selectedCscPath: null,
  status: "idle",
  error: null,
  lastScannedAt: null,
};

export function normalizeCProjectWorkspaceState(
  state: Partial<CProjectWorkspaceState> | null | undefined,
): CProjectWorkspaceState {
  const nextState: CProjectWorkspaceState = {
    ...emptyCProjectWorkspaceState,
    ...(state ?? {}),
  };

  const hasScanResult = Boolean(nextState.summary);

  return {
    ...nextState,
    status: hasScanResult ? "ready" : "idle",
    error: null,
  };
}

export function prepareCProjectWorkspaceStateForStorage(
  state: CProjectWorkspaceState,
): CProjectWorkspaceState {
  const hasScanResult = Boolean(state.summary);

  return {
    ...state,
    status:
      state.status === "scanning" || state.status === "error"
        ? hasScanResult
          ? "ready"
          : "idle"
        : state.status,
    error: null,
  };
}

export function resetCProjectScanForNewFolder(
  projectPath: string,
): CProjectWorkspaceState {
  return {
    ...emptyCProjectWorkspaceState,
    projectPath,
  };
}