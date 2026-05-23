import { Badge } from "@/components/ui/badge";
import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import type {
  DataDictionaryConstant,
  DataDictionaryDataType,
  DataDictionaryGlobalVariable,
} from "@/lib/dataDictionary";

export function ConstantsTable({
  constants,
}: {
  constants: DataDictionaryConstant[];
}) {
  const columns: SmartDataTableColumn<DataDictionaryConstant>[] = [
    {
      id: "name",
      header: "Name",
      accessor: (row) => <span className="font-medium">{row.name}</span>,
      searchValue: (row) => row.name,
    },
    {
      id: "kind",
      header: "Kind",
      accessor: (row) => row.kind,
      searchValue: (row) => row.kind,
      filterValue: (row) => row.kind,
    },
    {
      id: "value",
      header: "Value",
      accessor: (row) => row.value || "—",
      searchValue: (row) => row.value,
      className: "max-w-[420px] truncate",
    },
    {
      id: "file",
      header: "File",
      accessor: (row) => row.relativePath ?? row.file ?? "—",
      searchValue: (row) => row.relativePath ?? row.file ?? "",
      className: "max-w-[320px] truncate",
    },
    {
      id: "line",
      header: "Line",
      accessor: (row) => row.line,
      searchValue: (row) => String(row.line),
    },
    {
      id: "used",
      header: "Used",
      accessor: (row) => (
        <Badge variant={row.usedInSources ? "secondary" : "outline"}>
          {row.usedInSources ? "Yes" : "No"}
        </Badge>
      ),
      searchValue: (row) => (row.usedInSources ? "yes used" : "no unused"),
      filterValue: (row) => (row.usedInSources ? "Yes" : "No"),
    },
  ];

  return (
    <SmartDataTable
      data={constants}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search constants by name, value, file, usage..."
      emptyMessage="No constants found."
    />
  );
}

export function GlobalVariablesTable({
  globalVariables,
}: {
  globalVariables: DataDictionaryGlobalVariable[];
}) {
  const columns: SmartDataTableColumn<DataDictionaryGlobalVariable>[] = [
    {
      id: "name",
      header: "Name",
      accessor: (row) => <span className="font-medium">{row.name}</span>,
      searchValue: (row) => row.name,
    },
    {
      id: "dataType",
      header: "Data Type",
      accessor: (row) => row.dataType,
      searchValue: (row) => row.dataType,
      filterValue: (row) => row.dataType,
    },
    {
      id: "dimensions",
      header: "Dimensions",
      accessor: (row) => row.dimensions || "—",
      searchValue: (row) => row.dimensions,
    },
    {
      id: "initializer",
      header: "Initializer",
      accessor: (row) => row.initializer || "—",
      searchValue: (row) => row.initializer,
      className: "max-w-[360px] truncate",
    },
    {
      id: "file",
      header: "File",
      accessor: (row) => row.relativePath ?? row.file ?? "—",
      searchValue: (row) => row.relativePath ?? row.file ?? "",
      className: "max-w-[320px] truncate",
    },
    {
      id: "line",
      header: "Line",
      accessor: (row) => row.line,
      searchValue: (row) => String(row.line),
    },
    {
      id: "used",
      header: "Used",
      accessor: (row) => (
        <Badge variant={row.usedInSources ? "secondary" : "outline"}>
          {row.usedInSources ? "Yes" : "No"}
        </Badge>
      ),
      searchValue: (row) => (row.usedInSources ? "yes used" : "no unused"),
      filterValue: (row) => (row.usedInSources ? "Yes" : "No"),
    },
  ];

  return (
    <SmartDataTable
      data={globalVariables}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search variables by name, type, initializer, file..."
      emptyMessage="No global variables found."
    />
  );
}

export function DataTypesTable({
  dataTypes,
}: {
  dataTypes: DataDictionaryDataType[];
}) {
  const columns: SmartDataTableColumn<DataDictionaryDataType>[] = [
    {
      id: "name",
      header: "Name",
      accessor: (row) => <span className="font-medium">{row.name}</span>,
      searchValue: (row) => row.name,
    },
    {
      id: "kind",
      header: "Kind",
      accessor: (row) => row.kind,
      searchValue: (row) => row.kind,
      filterValue: (row) => row.kind,
    },
    {
      id: "definition",
      header: "Definition",
      accessor: (row) => row.definition || "—",
      searchValue: (row) => row.definition,
      className: "max-w-[520px] truncate",
    },
    {
      id: "file",
      header: "File",
      accessor: (row) => row.relativePath ?? row.file ?? "—",
      searchValue: (row) => row.relativePath ?? row.file ?? "",
      className: "max-w-[320px] truncate",
    },
    {
      id: "line",
      header: "Line",
      accessor: (row) => row.line,
      searchValue: (row) => String(row.line),
    },
    {
      id: "used",
      header: "Used",
      accessor: (row) => (
        <Badge variant={row.usedInSources ? "secondary" : "outline"}>
          {row.usedInSources ? "Yes" : "No"}
        </Badge>
      ),
      searchValue: (row) => (row.usedInSources ? "yes used" : "no unused"),
      filterValue: (row) => (row.usedInSources ? "Yes" : "No"),
    },
  ];

  return (
    <SmartDataTable
      data={dataTypes}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search data types by name, kind, definition, file..."
      emptyMessage="No data types found."
    />
  );
}