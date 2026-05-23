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

const STORAGE_KEY = "orosaitools.cProjectWorkspaceState.v1";

export const emptyCProjectWorkspaceState: CProjectWorkspaceState = {
  projectPath: "",
  summary: null,
  cscFolders: [],
  selectedCscPath: null,
  status: "idle",
  error: null,
  lastScannedAt: null,
};

export function loadCProjectWorkspaceState(): CProjectWorkspaceState {
  if (typeof window === "undefined") {
    return emptyCProjectWorkspaceState;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return emptyCProjectWorkspaceState;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<CProjectWorkspaceState>;

    const hasScanResult = Boolean(parsedValue.summary);

    return {
      ...emptyCProjectWorkspaceState,
      ...parsedValue,
      status: hasScanResult ? "ready" : "idle",
      error: null,
    };
  } catch {
    return emptyCProjectWorkspaceState;
  }
}

export function saveCProjectWorkspaceState(
  state: CProjectWorkspaceState,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const stateToSave: CProjectWorkspaceState = {
      ...state,
      status: state.status === "scanning" ? "idle" : state.status,
      error: null,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch {
    // Ignore localStorage errors.
  }
}

export function resetCProjectScanForNewFolder(
  projectPath: string,
): CProjectWorkspaceState {
  return {
    ...emptyCProjectWorkspaceState,
    projectPath,
  };
}