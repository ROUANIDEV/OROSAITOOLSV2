import type { Dispatch, SetStateAction } from "react";
import { DataDictionaryWorkspaceState } from "../state";

export type DataDictionaryWorkspaceProps = {
  selectedCscPath: string | null;
  onGoToCProjectScanner: () => void;
  state: DataDictionaryWorkspaceState;
  onStateChange: Dispatch<SetStateAction<DataDictionaryWorkspaceState>>;
};