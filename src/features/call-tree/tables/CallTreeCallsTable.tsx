import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import {
  getCallee,
  getCaller,
  getFile,
  getLine,
} from "@/features/call-tree/tables/callTreeCallTableAccessors";
import type { CallTreeCall } from "@/lib/callTree";

export function CallTreeCallsTable({ calls }: { calls: CallTreeCall[] }) {
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