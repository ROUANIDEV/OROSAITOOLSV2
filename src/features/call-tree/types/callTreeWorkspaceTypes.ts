import type { Dispatch, SetStateAction } from "react";

import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";

export type CallTreeWorkspaceProps = {
  selectedCscPath: string | null;
  onGoToCProjectScanner: () => void;
  state: CallTreeWorkspaceState;
  onStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>;
};