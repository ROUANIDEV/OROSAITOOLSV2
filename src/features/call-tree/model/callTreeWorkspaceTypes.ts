import type { Dispatch, SetStateAction } from "react";
import { CallTreeWorkspaceState } from "../state";


export type CallTreeWorkspaceProps = {
  selectedCscPath: string | null;
  onGoToCProjectScanner: () => void;
  state: CallTreeWorkspaceState;
  onStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>;
};