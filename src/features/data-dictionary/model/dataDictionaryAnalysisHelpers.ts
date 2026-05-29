import type { DataDictionaryAnalysisResult } from "@/lib/dataDictionary";

export function normalizeWorkspaceAnalysisResult(
  result: DataDictionaryAnalysisResult,
): DataDictionaryAnalysisResult {
  const constants = result.constants ?? [];
  const globalVariables = result.globalVariables ?? [];
  const dataTypes = result.dataTypes ?? [];

  return {
    ...result,
    constants,
    globalVariables,
    dataTypes,
    constantsCount: result.constantsCount ?? constants.length,
    globalVariablesCount:
      result.globalVariablesCount ?? globalVariables.length,
    dataTypesCount: result.dataTypesCount ?? dataTypes.length,
  };
}