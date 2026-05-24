import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import {
  normalizeDataDictionaryAnalysisResult,
  normalizeDataDictionaryExportResult,
} from "@/api/data-dictionary/dataDictionaryNormalizers";
import type {
  DataDictionaryAnalysisResult,
  DataDictionaryExportResult,
} from "@/api/data-dictionary/dataDictionaryTypes";

export async function analyzeDataDictionary(
  cscPath: string,
): Promise<DataDictionaryAnalysisResult> {
  const result = await invokeTauriCommand<unknown>(
    tauriCommandNames.analyzeDataDictionary,
    { cscPath },
  );

  return normalizeDataDictionaryAnalysisResult(result);
}

export async function exportDataDictionaryXlsx(
  cscPath: string,
): Promise<DataDictionaryExportResult> {
  const result = await invokeTauriCommand<unknown>(
    tauriCommandNames.exportDataDictionaryXlsx,
    { cscPath },
  );

  return normalizeDataDictionaryExportResult(result);
}