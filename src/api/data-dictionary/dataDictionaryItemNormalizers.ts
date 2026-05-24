import {
  asRecord,
  readBoolean,
  readNumber,
  readString,
} from "@/api/shared/rawRecord";

import {
  readFilePath,
  readSourcePath,
  readUsedInSources,
} from "@/api/data-dictionary/dataDictionaryReadHelpers";
import type {
  DataDictionaryConstant,
  DataDictionaryDataType,
  DataDictionaryGlobalVariable,
} from "@/api/data-dictionary/dataDictionaryTypes";

export function normalizeConstant(rawValue: unknown): DataDictionaryConstant {
  const raw = asRecord(rawValue);
  const relativePath = readSourcePath(raw);
  const usedInSources = readUsedInSources(raw);

  return {
    name: readString(raw, ["name", "constantName", "constant_name", "macro"]),
    kind: readString(raw, ["kind", "type", "category"], "Constant"),
    value: readString(raw, ["value", "definition", "initializer", "rawValue"]),
    file: relativePath,
    filePath: readFilePath(raw, relativePath),
    relativePath,
    line: readNumber(raw, ["line", "lineNumber", "line_number"]),
    usedInSources,
    used: usedInSources.length > 0 || readBoolean(raw, ["used", "isUsed"]),
  };
}

export function normalizeGlobalVariable(
  rawValue: unknown,
): DataDictionaryGlobalVariable {
  const raw = asRecord(rawValue);
  const relativePath = readSourcePath(raw);
  const usedInSources = readUsedInSources(raw);

  return {
    name: readString(raw, [
      "name",
      "variableName",
      "variable_name",
      "globalName",
      "global_name",
    ]),
    dataType: readString(raw, ["dataType", "data_type", "type"]),
    dimensions: readString(raw, ["dimensions", "dimension", "arraySize"]),
    initializer: readString(raw, ["initializer", "initialValue", "value"]),
    file: relativePath,
    filePath: readFilePath(raw, relativePath),
    relativePath,
    line: readNumber(raw, ["line", "lineNumber", "line_number"]),
    usedInSources,
    used: usedInSources.length > 0 || readBoolean(raw, ["used", "isUsed"]),
  };
}

export function normalizeDataType(
  rawValue: unknown,
): DataDictionaryDataType {
  const raw = asRecord(rawValue);
  const relativePath = readSourcePath(raw);
  const usedInSources = readUsedInSources(raw);

  return {
    name: readString(raw, ["name", "typeName", "type_name", "dataType"]),
    kind: readString(raw, ["kind", "type", "category"], "Type"),
    definition: readString(raw, ["definition", "body", "value", "declaration"]),
    file: relativePath,
    filePath: readFilePath(raw, relativePath),
    relativePath,
    line: readNumber(raw, ["line", "lineNumber", "line_number"]),
    usedInSources,
    used: usedInSources.length > 0 || readBoolean(raw, ["used", "isUsed"]),
  };
}