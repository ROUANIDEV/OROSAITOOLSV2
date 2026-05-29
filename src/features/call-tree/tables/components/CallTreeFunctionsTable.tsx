import {
  SmartDataTable,
  type SmartDataTableColumn,
} from "@/components/smart-table/SmartDataTable";
import {
  createSmartBadgeColumn,
  createSmartTextColumn,
} from "@/components/smart-table/smartTableColumns";
import type { CallTreeFunction } from "@/lib/callTree";
import { getCalledByCount, getCallsCount, getFile, getFunctionName, getIsRoot, getLine } from "../model";

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