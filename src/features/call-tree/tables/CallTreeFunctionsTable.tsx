import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import {
  createSmartBadgeColumn,
  createSmartTextColumn,
} from "@/components/smart-table/smartTableColumns";
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
    createSmartTextColumn({
      id: "name",
      header: "Function",
      value: getFunctionName,
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
    createSmartTextColumn({
      id: "calls",
      header: "Calls",
      value: getCallsCount,
    }),
    createSmartTextColumn({
      id: "calledBy",
      header: "Called By",
      value: getCalledByCount,
    }),
    createSmartBadgeColumn({
      id: "root",
      header: "Root",
      isActive: getIsRoot,
      activeSearchValue: "yes root",
      inactiveSearchValue: "no",
    }),
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