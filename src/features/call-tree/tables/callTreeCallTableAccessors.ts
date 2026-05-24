import {
  getNumberOrTextField,
  getTextField,
} from "@/features/call-tree/tables/callTreeTableFieldUtils";

export function getCaller(row: unknown): string {
  return getTextField(row, [
    "caller",
    "callerName",
    "caller_name",
    "callerFunction",
    "caller_function",
    "source",
    "sourceFunction",
    "source_function",
    "from",
    "fromFunction",
    "from_function",
    "parent",
    "parentFunction",
    "parent_function",
  ]);
}

export function getCallee(row: unknown): string {
  return getTextField(row, [
    "callee",
    "calleeName",
    "callee_name",
    "calleeFunction",
    "callee_function",
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
    "calledFunction",
    "called_function",
  ]);
}

export function getFile(row: unknown): string {
  return getTextField(row, [
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
  ]);
}

export function getLine(row: unknown): string | number {
  return getNumberOrTextField(row, [
    "line",
    "lineNumber",
    "line_number",
    "startLine",
    "start_line",
    "definitionLine",
    "definition_line",
    "callerLine",
    "caller_line",
    "calleeLine",
    "callee_line",
  ]);
}