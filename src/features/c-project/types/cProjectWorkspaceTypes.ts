import type { Dispatch, SetStateAction } from "react";

import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";

export type CProjectWorkspaceProps = {
  state: CProjectWorkspaceState;
  onStateChange: Dispatch<SetStateAction<CProjectWorkspaceState>>;
};

export type CProjectScannerActions = {
  onChooseFolder: () => void;
  onScanProject: () => void;
  onClearScanner: () => void;
  onSelectCsc: (path: string) => void;
};