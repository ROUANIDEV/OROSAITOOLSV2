import { invoke } from "@tauri-apps/api/core"

type RawRecord = Record<string, unknown>

export type DataDictionaryConstant = {
  name: string
  kind: string
  value: string
  file: string
  filePath: string
  relativePath: string
  line: number
  usedInSources: string[]
  used: boolean
}

export type DataDictionaryGlobalVariable = {
  name: string
  dataType: string
  dimensions: string
  initializer: string
  file: string
  filePath: string
  relativePath: string
  line: number
  usedInSources: string[]
  used: boolean
}

export type DataDictionaryDataType = {
  name: string
  kind: string
  definition: string
  file: string
  filePath: string
  relativePath: string
  line: number
  usedInSources: string[]
  used: boolean
}

export type DataDictionaryAnalysisResult = {
  rootPath: string
  sourceFiles: number
  headerFiles: number
  constantsCount: number
  globalVariablesCount: number
  dataTypesCount: number
  constants: DataDictionaryConstant[]
  globalVariables: DataDictionaryGlobalVariable[]
  dataTypes: DataDictionaryDataType[]
}

export type DataDictionaryExportResult = {
  outputPath: string
  sourceFiles: number
  headerFiles: number
  constantsCount: number
  globalVariablesCount: number
  dataTypesCount: number
}

export async function analyzeDataDictionary(
  cscPath: string,
): Promise<DataDictionaryAnalysisResult> {
  const result = await invoke<unknown>("analyze_data_dictionary", {
    cscPath,
  })

  return normalizeDataDictionaryAnalysisResult(asRecord(result))
}

export async function exportDataDictionaryXlsx(
  cscPath: string,
): Promise<DataDictionaryExportResult> {
  const result = await invoke<unknown>("export_data_dictionary_xlsx", {
    cscPath,
  })

  const raw = asRecord(result)

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
  }
}

function normalizeDataDictionaryAnalysisResult(
  raw: RawRecord,
): DataDictionaryAnalysisResult {
  const constants = readArray(raw, [
    "constants",
    "constantPreview",
    "constant_preview",
    "defines",
    "macros",
  ])
    .map(normalizeConstant)
    .filter((item) => item.name.trim().length > 0)

  const globalVariables = readArray(raw, [
    "globalVariables",
    "global_variables",
    "globalVariablePreview",
    "global_variable_preview",
    "variables",
    "globals",
  ])
    .map(normalizeGlobalVariable)
    .filter((item) => item.name.trim().length > 0)

  const dataTypes = readArray(raw, [
    "dataTypes",
    "data_types",
    "dataTypePreview",
    "data_type_preview",
    "types",
    "typedefs",
  ])
    .map(normalizeDataType)
    .filter((item) => item.name.trim().length > 0)

  return {
    rootPath: readString(raw, ["rootPath", "root_path"]),
    sourceFiles: readNumber(raw, ["sourceFiles", "source_files"]),
    headerFiles: readNumber(raw, ["headerFiles", "header_files"]),

    constantsCount: readNumber(
      raw,
      ["constantsCount", "constants_count"],
      constants.length,
    ),
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
  }
}

function normalizeConstant(rawValue: unknown): DataDictionaryConstant {
  const raw = asRecord(rawValue)

  const relativePath = readPath(raw)
  const filePath = readFilePath(raw, relativePath)
  const usedInSources = readUsedInSources(raw)

  return {
    name: readString(raw, ["name", "constantName", "constant_name", "macro"]),
    kind: readString(raw, ["kind", "type", "category"], "Constant"),
    value: readString(raw, ["value", "definition", "initializer", "rawValue", "raw_value"]),

    file: relativePath,
    filePath,
    relativePath,

    line: readNumber(raw, [
      "line",
      "lineNumber",
      "line_number",
      "startLine",
      "start_line",
      "definitionLine",
      "definition_line",
    ]),

    usedInSources,
    used: usedInSources.length > 0 || readBoolean(raw, ["used", "isUsed", "is_used"]),
  }
}

function normalizeGlobalVariable(rawValue: unknown): DataDictionaryGlobalVariable {
  const raw = asRecord(rawValue)

  const relativePath = readPath(raw)
  const filePath = readFilePath(raw, relativePath)
  const usedInSources = readUsedInSources(raw)

  return {
    name: readString(raw, [
      "name",
      "variableName",
      "variable_name",
      "globalName",
      "global_name",
    ]),
    dataType: readString(raw, [
      "dataType",
      "data_type",
      "type",
      "variableType",
      "variable_type",
    ]),
    dimensions: readString(raw, ["dimensions", "dimension", "arraySize", "array_size"]),
    initializer: readString(raw, ["initializer", "initialValue", "initial_value", "value"]),

    file: relativePath,
    filePath,
    relativePath,

    line: readNumber(raw, [
      "line",
      "lineNumber",
      "line_number",
      "startLine",
      "start_line",
      "definitionLine",
      "definition_line",
    ]),

    usedInSources,
    used: usedInSources.length > 0 || readBoolean(raw, ["used", "isUsed", "is_used"]),
  }
}

function normalizeDataType(rawValue: unknown): DataDictionaryDataType {
  const raw = asRecord(rawValue)

  const relativePath = readPath(raw)
  const filePath = readFilePath(raw, relativePath)
  const usedInSources = readUsedInSources(raw)

  return {
    name: readString(raw, ["name", "typeName", "type_name", "dataType", "data_type"]),
    kind: readString(raw, ["kind", "type", "category"], "Type"),
    definition: readString(raw, ["definition", "body", "value", "declaration"]),

    file: relativePath,
    filePath,
    relativePath,

    line: readNumber(raw, [
      "line",
      "lineNumber",
      "line_number",
      "startLine",
      "start_line",
      "definitionLine",
      "definition_line",
    ]),

    usedInSources,
    used: usedInSources.length > 0 || readBoolean(raw, ["used", "isUsed", "is_used"]),
  }
}

function readPath(raw: RawRecord): string {
  return readString(raw, [
    "relativePath",
    "relative_path",
    "file",
    "filePath",
    "file_path",
    "path",
    "sourceFile",
    "source_file",
    "sourcePath",
    "source_path",
    "headerFile",
    "header_file",
  ])
}

function readFilePath(raw: RawRecord, fallback: string): string {
  return readString(
    raw,
    ["filePath", "file_path", "path", "relativePath", "relative_path", "file"],
    fallback,
  )
}

function readUsedInSources(raw: RawRecord): string[] {
  const usedValues = readArray(raw, [
    "usedInSources",
    "used_in_sources",
    "usedIn",
    "used_in",
    "references",
    "referencedBy",
    "referenced_by",
  ])

  return usedValues
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
}

function asRecord(value: unknown): RawRecord {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as RawRecord
  }

  return {}
}

function readArray(record: RawRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function readString(record: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return fallback
}

function readNumber(record: RawRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string") {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return fallback
}

function readBoolean(record: RawRecord, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "boolean") {
      return value
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()

      if (["true", "yes", "1", "used"].includes(normalized)) {
        return true
      }

      if (["false", "no", "0", "unused"].includes(normalized)) {
        return false
      }
    }

    if (typeof value === "number") {
      return value !== 0
    }
  }

  return fallback
}