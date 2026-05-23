import { invoke } from "@tauri-apps/api/core"

type RawRecord = Record<string, unknown>

export type CallTreeFunction = {
  name: string
  functionName: string
  file: string
  filePath: string
  relativePath: string
  line: number
  callsCount: number
  calledByCount: number
  isRoot: boolean
}

export type CallTreeCall = {
  caller: string
  callee: string
  callingFunction: string
  calledFunction: string
  file: string
  filePath: string
  relativePath: string
  line: number
}

export type CallTreeAnalysisResult = {
  rootPath: string
  sourceFiles: number
  functionCount: number
  callCount: number
  rootFunctionCount: number
  rootFunctions: string[]

  functions: CallTreeFunction[]
  calls: CallTreeCall[]

  // Keep compatibility with older UI code.
  functionPreview: CallTreeFunction[]
  edges: CallTreeCall[]
}

export type CallTreeExportResult = {
  outputPath: string
  sourceFiles: number
  functionCount: number
  callCount: number
  rootFunctionCount: number
}

export async function analyzeCallTree(
  cscPath: string,
): Promise<CallTreeAnalysisResult> {
  const result = await invoke<RawRecord>("analyze_call_tree", {
    cscPath,
  })

  return normalizeCallTreeAnalysisResult(result)
}

export async function exportCallTreeXlsx(
  cscPath: string,
): Promise<CallTreeExportResult> {
  const result = await invoke<RawRecord>("export_call_tree_xlsx", {
    cscPath,
  })

  return {
    outputPath: readString(result, ["outputPath", "output_path"]),
    sourceFiles: readNumber(result, ["sourceFiles", "source_files"]),
    functionCount: readNumber(result, ["functionCount", "function_count"]),
    callCount: readNumber(result, ["callCount", "call_count"]),
    rootFunctionCount: readNumber(result, [
      "rootFunctionCount",
      "root_function_count",
    ]),
  }
}

function normalizeCallTreeAnalysisResult(raw: RawRecord): CallTreeAnalysisResult {
  const rawFunctions = readArray(raw, [
    "functions",
    "functionPreview",
    "function_preview",
  ])

  const rawCalls = readArray(raw, ["calls", "edges"])

  const functions = rawFunctions.map(normalizeFunction).filter((item) => {
    return item.name.trim().length > 0 || item.relativePath.trim().length > 0
  })

  const calls = rawCalls.map(normalizeCall).filter((item) => {
    return (
      item.caller.trim().length > 0 ||
      item.callee.trim().length > 0 ||
      item.relativePath.trim().length > 0
    )
  })

  return {
    rootPath: readString(raw, ["rootPath", "root_path"]),
    sourceFiles: readNumber(raw, ["sourceFiles", "source_files"]),
    functionCount: readNumber(raw, ["functionCount", "function_count"], functions.length),
    callCount: readNumber(raw, ["callCount", "call_count"], calls.length),
    rootFunctionCount: readNumber(raw, [
      "rootFunctionCount",
      "root_function_count",
    ]),
    rootFunctions: readStringArray(raw, ["rootFunctions", "root_functions"]),

    functions,
    calls,

    functionPreview: functions.slice(0, 100),
    edges: calls,
  }
}

function normalizeFunction(rawValue: unknown): CallTreeFunction {
  const raw = asRecord(rawValue)

  const name = readString(raw, [
    "name",
    "functionName",
    "function_name",
    "function",
    "symbol",
    "signature",
    "qualifiedName",
    "qualified_name",
    "label",
    "id",
  ])

  const relativePath = readString(raw, [
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
  ])

  const filePath = readString(raw, [
    "filePath",
    "file_path",
    "path",
    "relativePath",
    "relative_path",
    "file",
  ])

  return {
    name,
    functionName: name,

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
    callsCount: readNumber(raw, [
      "callsCount",
      "calls_count",
      "outgoingCalls",
      "outgoing_calls",
      "calleesCount",
      "callees_count",
    ]),
    calledByCount: readNumber(raw, [
      "calledByCount",
      "called_by_count",
      "incomingCalls",
      "incoming_calls",
      "callersCount",
      "callers_count",
    ]),
    isRoot: readBoolean(raw, ["isRoot", "is_root", "root"]),
  }
}

function normalizeCall(rawValue: unknown): CallTreeCall {
  const raw = asRecord(rawValue)

  const caller = readString(raw, [
    "caller",
    "callerName",
    "caller_name",
    "callerFunction",
    "caller_function",
    "callingFunction",
    "calling_function",
    "source",
    "sourceFunction",
    "source_function",
    "from",
    "fromFunction",
    "from_function",
    "parent",
    "parentFunction",
    "parent_function",
  ])

  const callee = readString(raw, [
    "callee",
    "calleeName",
    "callee_name",
    "calleeFunction",
    "callee_function",
    "calledFunction",
    "called_function",
    "target",
    "targetFunction",
    "target_function",
    "to",
    "toFunction",
    "to_function",
    "child",
    "childFunction",
    "child_function",
    "called",
  ])

  const relativePath = readString(raw, [
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
    "callerFile",
    "caller_file",
    "calleeFile",
    "callee_file",
  ])

  const filePath = readString(raw, [
    "filePath",
    "file_path",
    "path",
    "relativePath",
    "relative_path",
    "file",
  ])

  return {
    caller,
    callee,

    callingFunction: caller,
    calledFunction: callee,

    file: relativePath,
    filePath,
    relativePath,

    line: readNumber(raw, [
      "line",
      "lineNumber",
      "line_number",
      "startLine",
      "start_line",
      "callerLine",
      "caller_line",
      "calleeLine",
      "callee_line",
    ]),
  }
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

function readStringArray(record: RawRecord, keys: string[]): string[] {
  return readArray(record, keys)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
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

      if (["true", "yes", "1"].includes(normalized)) {
        return true
      }

      if (["false", "no", "0"].includes(normalized)) {
        return false
      }
    }

    if (typeof value === "number") {
      return value !== 0
    }
  }

  return fallback
}