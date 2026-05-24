import type { Dispatch, SetStateAction } from "react";

import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";

export type DataDictionaryWorkspaceProps = {
  selectedCscPath: string | null;
  onGoToCProjectScanner: () => void;
  state: DataDictionaryWorkspaceState;
  onStateChange: Dispatch<SetStateAction<DataDictionaryWorkspaceState>>;
};