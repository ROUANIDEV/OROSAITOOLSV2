import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import { createSmartTextColumn } from "@/components/smart-table/smartTableColumns";
import type { CallTreeCall } from "@/lib/callTree";
import { getCallee, getCaller, getFile, getLine } from "../model";

export function CallTreeCallsTable({ calls }: { calls: CallTreeCall[] }) {
  const columns: SmartDataTableColumn<CallTreeCall>[] = [
    createSmartTextColumn({
      id: "caller",
      header: "Caller",
      value: getCaller,
      emphasized: true,
    }),
    createSmartTextColumn({
      id: "callee",
      header: "Callee",
      value: getCallee,
      emphasized: true,
    }),
    createSmartTextColumn({
      id: "file",
      header: "File",
      value: getFile,
      className: "max-w-[360px] truncate",
    }),
    createSmartTextColumn({
      id: "line",
      header: "Line",
      value: getLine,
    }),
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