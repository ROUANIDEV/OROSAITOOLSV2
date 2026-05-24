import {
  asRecord,
  readArray,
  readNumber,
  readString,
} from "@/api/shared/rawRecord";

import {
  normalizeConstant,
  normalizeDataType,
  normalizeGlobalVariable,
} from "@/api/data-dictionary/dataDictionaryItemNormalizers";
import type {
  DataDictionaryAnalysisResult,
  DataDictionaryExportResult,
} from "@/api/data-dictionary/dataDictionaryTypes";

export function normalizeDataDictionaryAnalysisResult(
  rawValue: unknown,
): DataDictionaryAnalysisResult {
  const raw = asRecord(rawValue);

  const constants = readArray(raw, ["constants", "constantPreview", "macros"])
    .map(normalizeConstant)
    .filter((item) => item.name.trim().length > 0);

  const globalVariables = readArray(raw, [
    "globalVariables",
    "global_variables",
    "globalVariablePreview",
    "variables",
    "globals",
  ])
    .map(normalizeGlobalVariable)
    .filter((item) => item.name.trim().length > 0);

  const dataTypes = readArray(raw, [
    "dataTypes",
    "data_types",
    "dataTypePreview",
    "types",
    "typedefs",
  ])
    .map(normalizeDataType)
    .filter((item) => item.name.trim().length > 0);

  return {
    rootPath: readString(raw, ["rootPath", "root_path"]),
    sourceFiles: readNumber(raw, ["sourceFiles", "source_files"]),
    headerFiles: readNumber(raw, ["headerFiles", "header_files"]),
    constantsCount: readNumber(raw, ["constantsCount"], constants.length),
    globalVariablesCount: readNumber(
      raw,
      ["globalVariablesCount", "global_variables_count"],
      globalVariables.length,
    ),
    dataTypesCount: readNumber(
      raw,
      ["dataTypesCount", "data_types_count"],
      dataTypes.length,
    ),
    constants,
    globalVariables,
    dataTypes,
  };
}

export function normalizeDataDictionaryExportResult(
  rawValue: unknown,
): DataDictionaryExportResult {
  const raw = asRecord(rawValue);

  return {
    outputPath: readString(raw, ["outputPath", "output_path"]),
    sourceFiles: readNumber(raw, ["sourceFiles", "source_files"]),
    headerFiles: readNumber(raw, ["headerFiles", "header_files"]),
    constantsCount: readNumber(raw, ["constantsCount", "constants_count"]),
    globalVariablesCount: readNumber(raw, [
      "globalVariablesCount",
      "global_variables_count",
    ]),
    dataTypesCount: readNumber(raw, ["dataTypesCount", "data_types_count"]),
  };
}