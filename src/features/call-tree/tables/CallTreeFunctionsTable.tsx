import { Badge } from "@/components/ui/badge";
import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import {
  getCalledByCount,
  getCallsCount,
  getFunctionName,
  getIsRoot,
} from "@/features/call-tree/tables/callTreeFunctionTableAccessors";
import {
  getFile,
  getLine,
} from "@/features/call-tree/tables/callTreeCallTableAccessors";
import type { CallTreeFunction } from "@/lib/callTree";

export function CallTreeFunctionsTable({
  functions,
}: {
  functions: CallTreeFunction[];
}) {
  const columns: SmartDataTableColumn<CallTreeFunction>[] = [
    {
      id: "name",
      header: "Function",
      accessor: (row) => (
        <span className="font-medium">{getFunctionName(row)}</span>
      ),
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