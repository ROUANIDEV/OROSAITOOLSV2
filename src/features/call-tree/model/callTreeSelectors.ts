import { asRecord } from "@/api/shared/rawRecord";

import type {
  CallTreeAnalysisResult,
  CallTreeCall,
  CallTreeFunction,
} from "@/lib/callTree";

export function getResultNumber(
  result: unknown,
  keys: string[],
): string | number {
  const record = asRecord(result);

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "—";
}

export function getCallTreeFunctions(
  analysis: CallTreeAnalysisResult | null,
): CallTreeFunction[] {
  if (!analysis) {
    return [];
  }

  return mergeArrays<CallTreeFunction>([
    getArrayField(analysis, [
      "functions",
      "functionItems",
      "function_items",
      "allFunctions",
      "all_functions",
      "nodes",
      "functionPreview",
      "function_preview",
    ]),
  ]);
}

export function getCallTreeCalls(
  analysis: CallTreeAnalysisResult | null,
): CallTreeCall[] {
  if (!analysis) {
    return [];
  }

  return mergeArrays<CallTreeCall>([
    getArrayField(analysis, [
      "calls",
      "callItems",
      "call_items",
      "functionCalls",
      "function_calls",
    ]),
    getArrayField(analysis, [
      "edges",
      "callEdges",
      "call_edges",
      "relationships",
      "callRelationships",
      "call_relationships",
    ]),
  ]);
}

function getArrayField<T>(value: unknown, keys: string[]): T[] {
  const record = asRecord(value);
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (realKey && Array.isArray(record[realKey])) {
      return record[realKey] as T[];
    }
  }

  return [];
}

function mergeArrays<T>(arrays: T[][]): T[] {
  return arrays.flatMap((array) => array);
}

function normalizeKey(value: string): string {
  return value.replace(/[_\-\s]/g, "").toLowerCase();
}