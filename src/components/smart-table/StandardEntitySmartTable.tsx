import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import { Badge } from "@/components/ui/badge";
import {
  getStandardEntityFile,
  getStandardEntityFileSearch,
  getStandardEntityUsedFilterValue,
  getStandardEntityUsedSearchValue,
  normalizeStandardEntityUsedValue,
  type StandardEntityTableRow,
  type StandardEntityUsedValue,
} from "@/lib/standardEntityTable";

export type { StandardEntityTableRow, StandardEntityUsedValue } from "@/lib/standardEntityTable";

export type StandardEntityTableColumn<T extends StandardEntityTableRow> =
  SmartDataTableColumn<T>;

type StandardEntitySmartTableProps<T extends StandardEntityTableRow> = {
  data: T[];
  detailColumns: StandardEntityTableColumn<T>[];
  searchPlaceholder: string;
  emptyMessage: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
};

export function StandardEntitySmartTable<T extends StandardEntityTableRow>({
  data,
  detailColumns,
  searchPlaceholder,
  emptyMessage,
  defaultPageSize = 20,
  pageSizeOptions,
}: StandardEntitySmartTableProps<T>) {
  return (
    <SmartDataTable
      data={data}
      columns={createStandardEntityColumns(detailColumns)}
      defaultPageSize={defaultPageSize}
      pageSizeOptions={pageSizeOptions}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
    />
  );
}

export function createStandardEntityColumns<T extends StandardEntityTableRow>(
  detailColumns: StandardEntityTableColumn<T>[],
): StandardEntityTableColumn<T>[] {
  return [
    createNameColumn<T>(),
    ...detailColumns,
    createFileColumn<T>(),
    createLineColumn<T>(),
    createUsedColumn<T>(),
  ];
}

function createNameColumn<T extends StandardEntityTableRow>(): StandardEntityTableColumn<T> {
  return {
    id: "name",
    header: "Name",
    accessor: (row) => <span className="font-medium">{row.name}</span>,
    searchValue: (row) => row.name,
  };
}

function createFileColumn<T extends StandardEntityTableRow>(): StandardEntityTableColumn<T> {
  return {
    id: "file",
    header: "File",
    accessor: (row) => getStandardEntityFile(row),
    searchValue: (row) => getStandardEntityFileSearch(row),
    className: "max-w-[320px] truncate",
  };
}

function createLineColumn<T extends StandardEntityTableRow>(): StandardEntityTableColumn<T> {
  return {
    id: "line",
    header: "Line",
    accessor: (row) => row.line,
    searchValue: (row) => String(row.line),
  };
}

function createUsedColumn<T extends StandardEntityTableRow>(): StandardEntityTableColumn<T> {
  return {
    id: "used",
    header: "Used",
    accessor: (row) => <StandardEntityUsedBadge used={row.usedInSources} />,
    searchValue: (row) => getStandardEntityUsedSearchValue(row.usedInSources),
    filterValue: (row) => getStandardEntityUsedFilterValue(row.usedInSources),
  };
}

function StandardEntityUsedBadge({ used }: { used: StandardEntityUsedValue }) {
  const isUsed = normalizeStandardEntityUsedValue(used);

  return (
    <Badge variant={isUsed ? "secondary" : "outline"}>
      {isUsed ? "Yes" : "No"}
    </Badge>
  );
}