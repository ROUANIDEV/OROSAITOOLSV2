import type { Dispatch, SetStateAction } from "react";

import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import { normalizeWorkspaceAnalysisResult } from "@/features/data-dictionary/dataDictionaryAnalysisHelpers";
import {
  analyzeDataDictionary,
  exportDataDictionaryXlsx,
} from "@/lib/dataDictionary";

type UseDataDictionaryActionsArgs = {
  selectedCscPath: string | null;
  onStateChange: Dispatch<SetStateAction<DataDictionaryWorkspaceState>>;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function setMissingCscError(
  onStateChange: Dispatch<SetStateAction<DataDictionaryWorkspaceState>>,
): void {
  onStateChange((current) => ({
    ...current,
    status: "error",
    error: "Select a CSC folder first from the C Project Scanner.",
  }));
}

export function useDataDictionaryActions({
  selectedCscPath,
  onStateChange,
}: UseDataDictionaryActionsArgs) {
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

      const result = await analyzeDataDictionary(selectedCscPath);

      onStateChange((current) => ({
        ...current,
        status: "ready",
        analysis: normalizeWorkspaceAnalysisResult(result),
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

      const result = await exportDataDictionaryXlsx(selectedCscPath);

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