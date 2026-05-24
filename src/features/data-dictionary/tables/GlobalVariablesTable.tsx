import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import {
  DataDictionaryUsedBadge,
  getDataDictionaryFile,
  getDataDictionaryFileSearch,
  getUsedFilterValue,
  getUsedSearchValue,
} from "@/features/data-dictionary/tables/DataDictionaryTableCells";
import type { DataDictionaryGlobalVariable } from "@/lib/dataDictionary";

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
      searchValue: (row) => row.dimensions ?? "",
    },
    {
      id: "initializer",
      header: "Initializer",
      accessor: (row) => row.initializer || "—",
      searchValue: (row) => row.initializer ?? "",
      className: "max-w-[360px] truncate",
    },
    {
      id: "file",
      header: "File",
      accessor: (row) => getDataDictionaryFile(row),
      searchValue: (row) => getDataDictionaryFileSearch(row),
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
        <DataDictionaryUsedBadge used={row.usedInSources} />
      ),
      searchValue: (row) => getUsedSearchValue(row.usedInSources),
      filterValue: (row) => getUsedFilterValue(row.usedInSources),
    },
  ];

  return (
    <SmartDataTable
      data={globalVariables}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search globals by name, type, file, usage..."
      emptyMessage="No global variables found."
    />
  );
}