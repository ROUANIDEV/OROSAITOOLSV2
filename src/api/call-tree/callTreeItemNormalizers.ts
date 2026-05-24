import {
  asRecord,
  readBoolean,
  readNumber,
  readString,
} from "@/api/shared/rawRecord";

import type {
  CallTreeCall,
  CallTreeFunction,
} from "@/api/call-tree/callTreeTypes";

export function normalizeCallTreeFunction(rawValue: unknown): CallTreeFunction {
  const raw = asRecord(rawValue);

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
  ]);

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
  ]);

  return {
    name,
    functionName: name,
    file: relativePath,
    filePath: readString(raw, ["filePath", "file_path", "path"], relativePath),
    relativePath,
    line: readNumber(raw, ["line", "lineNumber", "line_number"]),
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
  };
}

export function normalizeCallTreeCall(rawValue: unknown): CallTreeCall {
  const raw = asRecord(rawValue);

  const caller = readString(raw, [
    "caller",
    "callerName",
    "caller_name",
    "callerFunction",
    "caller_function",
    "callingFunction",
    "calling_function",
    "source",
    "from",
    "parent",
  ]);

  const callee = readString(raw, [
    "callee",
    "calleeName",
    "callee_name",
    "calleeFunction",
    "callee_function",
    "calledFunction",
    "called_function",
    "target",
    "to",
    "child",
  ]);

  const relativePath = readString(raw, [
    "relativePath",
    "relative_path",
    "file",
    "filePath",
    "file_path",
    "path",
  ]);

  return {
    caller,
    callee,
    callingFunction: caller,
    calledFunction: callee,
    file: relativePath,
    filePath: readString(raw, ["filePath", "file_path", "path"], relativePath),
    relativePath,
    line: readNumber(raw, ["line", "lineNumber", "line_number"]),
  };
}