import {
  asRecord,
  readArray,
  readNumber,
  readString,
  readStringArray,
} from "@/api/shared/rawRecord";

import {
  normalizeCallTreeCall,
  normalizeCallTreeFunction,
} from "@/api/call-tree/callTreeItemNormalizers";
import type {
  CallTreeAnalysisResult,
  CallTreeCall,
  CallTreeExportResult,
  CallTreeFunction,
} from "@/api/call-tree/callTreeTypes";

function hasFunctionIdentity(item: CallTreeFunction): boolean {
  return item.name.trim().length > 0 || item.relativePath.trim().length > 0;
}

function hasCallIdentity(item: CallTreeCall): boolean {
  return (
    item.caller.trim().length > 0 ||
    item.callee.trim().length > 0 ||
    item.relativePath.trim().length > 0
  );
}

export function normalizeCallTreeAnalysisResult(
  rawValue: unknown,
): CallTreeAnalysisResult {
  const raw = asRecord(rawValue);

  const functions = readArray(raw, [
    "functions",
    "functionPreview",
    "function_preview",
  ])
    .map(normalizeCallTreeFunction)
    .filter(hasFunctionIdentity);

  const calls = readArray(raw, ["calls", "edges"])
    .map(normalizeCallTreeCall)
    .filter(hasCallIdentity);

  return {
    rootPath: readString(raw, ["rootPath", "root_path"]),
    sourceFiles: readNumber(raw, ["sourceFiles", "source_files"]),
    functionCount: readNumber(
      raw,
      ["functionCount", "function_count"],
      functions.length,
    ),
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
  };
}

export function normalizeCallTreeExportResult(
  rawValue: unknown,
): CallTreeExportResult {
  const raw = asRecord(rawValue);

  return {
    outputPath: readString(raw, ["outputPath", "output_path"]),
    sourceFiles: readNumber(raw, ["sourceFiles", "source_files"]),
    functionCount: readNumber(raw, ["functionCount", "function_count"]),
    callCount: readNumber(raw, ["callCount", "call_count"]),
    rootFunctionCount: readNumber(raw, [
      "rootFunctionCount",
      "root_function_count",
    ]),
  };
}