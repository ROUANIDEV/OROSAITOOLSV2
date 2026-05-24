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
import type { DataDictionaryConstant } from "@/lib/dataDictionary";

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
      searchValue: (row) => row.value ?? "",
      className: "max-w-[420px] truncate",
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
      data={constants}
      columns={columns}
      defaultPageSize={20}
      searchPlaceholder="Search constants by name, value, file, usage..."
      emptyMessage="No constants found."
    />
  );
}