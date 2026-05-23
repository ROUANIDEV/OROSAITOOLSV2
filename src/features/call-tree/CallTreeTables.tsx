import { Badge } from "@/components/ui/badge";
import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import type {
  CallTreeCall,
  CallTreeFunction,
} from "@/lib/callTree";

export function CallTreeFunctionsTable({
  functions,
}: {
  functions: CallTreeFunction[];
}) {
  const columns: SmartDataTableColumn<CallTreeFunction>[] = [
    {
      id: "name",
      header: "Function",
      accessor: (row) => <span className="font-medium">{getFunctionName(row)}</span>,
      searchValue: (row) => getFunctionName(row),
    },
    {
      id: "file",
      header: "File",
      accessor: (row) => getFile(row),
      searchValue: (row) => getFile(row),
      className: "max-w-[360px] truncate",
    },
    {
      id: "line",
      header: "Line",
      accessor: (row) => getLine(row),
      searchValue: (row) => String(getLine(row)),
    },
    {
      id: "calls",
      header: "Calls",
      accessor: (row) => getCallsCount(row),
      searchValue: (row) => String(getCallsCount(row)),
    },
    {
      id: "calledBy",
      header: "Called By",
      accessor: (row) => getCalledByCount(row),
      searchValue: (row) => String(getCalledByCount(row)),
    },
    {
      id: "root",
      header: "Root",
      accessor: (row) => (
        <Badge variant={getIsRoot(row) ? "secondary" : "outline"}>
          {getIsRoot(row) ? "Yes" : "No"}
        </Badge>
      ),
      searchValue: (row) => (getIsRoot(row) ? "yes root" : "no"),
      filterValue: (row) => (getIsRoot(row) ? "Yes" : "No"),
    },
  ];

  return (
    <SmartDataTable
      data={functions}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search functions by name, file, line..."
      emptyMessage="No functions found."
    />
  );
}

export function CallTreeCallsTable({
  calls,
}: {
  calls: CallTreeCall[];
}) {
  const columns: SmartDataTableColumn<CallTreeCall>[] = [
    {
      id: "caller",
      header: "Caller",
      accessor: (row) => <span className="font-medium">{getCaller(row)}</span>,
      searchValue: (row) => getCaller(row),
    },
    {
      id: "callee",
      header: "Callee",
      accessor: (row) => <span className="font-medium">{getCallee(row)}</span>,
      searchValue: (row) => getCallee(row),
    },
    {
      id: "file",
      header: "File",
      accessor: (row) => getFile(row),
      searchValue: (row) => getFile(row),
      className: "max-w-[360px] truncate",
    },
    {
      id: "line",
      header: "Line",
      accessor: (row) => getLine(row),
      searchValue: (row) => String(getLine(row)),
    },
  ];

  return (
    <SmartDataTable
      data={calls}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search calls by caller, callee, file, line..."
      emptyMessage="No calls found."
    />
  );
}

function getFunctionName(row: unknown): string {
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

function getCaller(row: unknown): string {
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

function getCallee(row: unknown): string {
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

function getFile(row: unknown): string {
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

function getLine(row: unknown): string | number {
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

function getCallsCount(row: unknown): string | number {
  return getNumberOrTextField(row, [
    "callsCount",
    "calls_count",
    "outgoingCalls",
    "outgoing_calls",
    "calleesCount",
    "callees_count",
  ]);
}

function getCalledByCount(row: unknown): string | number {
  return getNumberOrTextField(row, [
    "calledByCount",
    "called_by_count",
    "incomingCalls",
    "incoming_calls",
    "callersCount",
    "callers_count",
  ]);
}

function getIsRoot(row: unknown): boolean {
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

function getTextField(row: unknown, keys: string[]): string {
  if (typeof row === "string" || typeof row === "number") {
    return String(row);
  }

  const value = getRawField(row, keys);

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const nestedName = getRawField(value, [
      "name",
      "functionName",
      "function_name",
      "label",
      "id",
      "path",
      "relativePath",
      "relative_path",
    ]);

    if (nestedName !== null && nestedName !== undefined && nestedName !== "") {
      return String(nestedName);
    }
  }

  return String(value);
}

function getNumberOrTextField(row: unknown, keys: string[]): string | number {
  const value = getRawField(row, keys);

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "—";
}

function getRawField(row: unknown, keys: string[]): unknown {
  if (!row || typeof row !== "object") {
    return undefined;
  }

  const record = row as Record<string, unknown>;
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function normalizeKey(value: string): string {
  return value.replace(/[_\-\s]/g, "").toLowerCase();
}