import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SmartDataTableColumn<T> = {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
  filterValue?: (row: T) => string;
  className?: string;
};

type SmartDataTableProps<T> = {
  data: T[];
  columns: SmartDataTableColumn<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
};

const ALL_FILTER_VALUE = "__all__";

export function SmartDataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search all columns...",
  emptyMessage = "No rows found.",
  defaultPageSize = 20,
  pageSizeOptions = [20, 50, 100],
}: SmartDataTableProps<T>) {
  const [globalQuery, setGlobalQuery] = useState("");
  const [columnQueries, setColumnQueries] = useState<Record<string, string>>({});
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);

  const filterableColumns = useMemo(() => {
    return columns.filter((column) => Boolean(column.filterValue));
  }, [columns]);

  const filterOptions = useMemo(() => {
    const result: Record<string, string[]> = {};

    for (const column of filterableColumns) {
      const values = new Set<string>();

      for (const row of data) {
        const value = cleanDisplayText(column.filterValue?.(row) ?? "");

        if (value) {
          values.add(value);
        }
      }

      result[column.id] = Array.from(values).sort((a, b) =>
        a.localeCompare(b),
      );
    }

    return result;
  }, [data, filterableColumns]);

  const filteredData = useMemo(() => {
    const normalizedGlobalQuery = normalizeText(globalQuery);

    return data.filter((row) => {
      if (normalizedGlobalQuery) {
        const matchesGlobalSearch = columns.some((column) =>
          getColumnSearchText(column, row).includes(normalizedGlobalQuery),
        );

        if (!matchesGlobalSearch) {
          return false;
        }
      }

      for (const column of columns) {
        const query = normalizeText(columnQueries[column.id] ?? "");

        if (!query) {
          continue;
        }

        if (!getColumnSearchText(column, row).includes(query)) {
          return false;
        }
      }

      for (const column of filterableColumns) {
        const selectedValue = selectFilters[column.id];

        if (!selectedValue || selectedValue === ALL_FILTER_VALUE) {
          continue;
        }

        const rowValue = normalizeText(column.filterValue?.(row) ?? "");

        if (rowValue !== normalizeText(selectedValue)) {
          return false;
        }
      }

      return true;
    });
  }, [
    columnQueries,
    columns,
    data,
    filterableColumns,
    globalQuery,
    selectFilters,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const visibleRows = filteredData.slice(startIndex, startIndex + pageSize);

  const hasFilters =
    Boolean(globalQuery.trim()) ||
    Object.values(columnQueries).some((value) => Boolean(value.trim())) ||
    Object.values(selectFilters).some(
      (value) => value && value !== ALL_FILTER_VALUE,
    );

  useEffect(() => {
    setPage(1);
  }, [globalQuery, columnQueries, selectFilters, pageSize]);

  function handleColumnQueryChange(columnId: string, value: string) {
    setColumnQueries((current) => ({
      ...current,
      [columnId]: value,
    }));
  }

  function handleSelectFilterChange(columnId: string, value: string) {
    setSelectFilters((current) => ({
      ...current,
      [columnId]: value,
    }));
  }

  function handleClearFilters() {
    setGlobalQuery("");
    setColumnQueries({});
    setSelectFilters({});
    setPage(1);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative xl:w-105">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterableColumns.map((column) => (
            <Select
              key={column.id}
              value={selectFilters[column.id] ?? ALL_FILTER_VALUE}
              onValueChange={(value) =>
                handleSelectFilterChange(column.id, value)
              }
            >
              <SelectTrigger className="w-42.5">
                <SelectValue placeholder={column.header} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>
                  All {column.header}
                </SelectItem>

                {(filterOptions[column.id] ?? []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-30">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="size-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className="align-top">
                  <div className="grid min-w-35 gap-2 py-1">
                    <span>{column.header}</span>
                    <Input
                      value={columnQueries[column.id] ?? ""}
                      onChange={(event) =>
                        handleColumnQueryChange(column.id, event.target.value)
                      }
                      placeholder={`Search ${column.header}`}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.accessor(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredData.length === 0 ? 0 : startIndex + 1}
          </span>
          {" - "}
          <span className="font-medium text-foreground">
            {Math.min(startIndex + visibleRows.length, filteredData.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {filteredData.length}
          </span>{" "}
          rows
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>

          <span>
            Page{" "}
            <span className="font-medium text-foreground">{safePage}</span> of{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function getColumnSearchText<T>(
  column: SmartDataTableColumn<T>,
  row: T,
): string {
  const value = column.searchValue?.(row) ?? nodeToText(column.accessor(row));
  return normalizeText(value);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function cleanDisplayText(value: string): string {
  return value.trim();
}

function nodeToText(value: ReactNode): string {
  if (value === null || value === undefined || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
}