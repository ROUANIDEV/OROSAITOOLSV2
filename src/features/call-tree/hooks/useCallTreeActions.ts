import type { Dispatch, SetStateAction } from "react";

import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import { analyzeCallTree, exportCallTreeXlsx } from "@/lib/callTree";

type UseCallTreeActionsArgs = {
  selectedCscPath: string | null;
  onStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function setMissingCscError(
  onStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>,
): void {
  onStateChange((current) => ({
    ...current,
    status: "error",
    error: "Select a CSC folder first from the C Project Scanner.",
  }));
}

export function useCallTreeActions({
  selectedCscPath,
  onStateChange,
}: UseCallTreeActionsArgs) {
  async function handleAnalyze() {
    if (!selectedCscPath) {
      setMissingCscError(onStateChange);
      return;
    }

    try {
      onStateChange((current) => ({
        ...current,
        status: "analyzing",
        error: null,
      }));

      const result = await analyzeCallTree(selectedCscPath);

      onStateChange((current) => ({
        ...current,
        status: "ready",
        analysis: result,
        error: null,
        lastAnalyzedAt: new Date().toISOString(),
      }));
    } catch (error) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: getErrorMessage(error),
      }));
    }
  }

  async function handleExport() {
    if (!selectedCscPath) {
      setMissingCscError(onStateChange);
      return;
    }

    try {
      onStateChange((current) => ({
        ...current,
        status: "exporting",
        error: null,
        exportResult: null,
      }));

      const result = await exportCallTreeXlsx(selectedCscPath);

      onStateChange((current) => ({
        ...current,
        status: "ready",
        exportResult: result,
        error: null,
        lastExportedAt: new Date().toISOString(),
      }));
    } catch (error) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: getErrorMessage(error),
      }));
    }
  }

  return {
    handleAnalyze,
    handleExport,
  };
}