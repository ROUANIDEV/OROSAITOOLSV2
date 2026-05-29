import { getNumberOrTextField, getRawField, getTextField } from "./callTreeTableFieldUtils";

export function getFunctionName(row: unknown): string {
  return getTextField(row, [
    "name",
    "functionName",
    "function_name",
    "function",
    "function_name",
    "symbol",
    "signature",
    "qualifiedName",
    "qualified_name",
    "label",
    "id",
    "caller",
    "callerName",
    "caller_name",
    "callee",
    "calleeName",
    "callee_name",
  ]);
}

export function getCallsCount(row: unknown): string | number {
  return getNumberOrTextField(row, [
    "callsCount",
    "calls_count",
    "outgoingCalls",
    "outgoing_calls",
    "calleesCount",
    "callees_count",
  ]);
}

export function getCalledByCount(row: unknown): string | number {
  return getNumberOrTextField(row, [
    "calledByCount",
    "called_by_count",
    "incomingCalls",
    "incoming_calls",
    "callersCount",
    "callers_count",
  ]);
}

export function getIsRoot(row: unknown): boolean {
  const value = getRawField(row, [
    "isRoot",
    "is_root",
    "root",
    "isEntryPoint",
    "is_entry_point",
    "entryPoint",
    "entry_point",
  ]);

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "yes", "1", "root"].includes(value.trim().toLowerCase());
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}