import { StandardEntitySmartTable } from "@/components/smart-table/StandardEntitySmartTable";
import { createSmartTextColumn } from "@/components/smart-table/smartTableColumns";
import type { DataDictionaryGlobalVariable } from "@/lib/dataDictionary";

export function GlobalVariablesTable({
  globalVariables,
}: {
  globalVariables: DataDictionaryGlobalVariable[];
}) {
  return (
    <StandardEntitySmartTable
      data={globalVariables}
      detailColumns={[
        createSmartTextColumn<DataDictionaryGlobalVariable>({
          id: "dataType",
          header: "Data Type",
          value: (row) => row.dataType,
          filterable: true,
        }),
        createSmartTextColumn<DataDictionaryGlobalVariable>({
          id: "dimensions",
          header: "Dimensions",
          value: (row) => row.dimensions,
        }),
        createSmartTextColumn<DataDictionaryGlobalVariable>({
          id: "initializer",
          header: "Initializer",
          value: (row) => row.initializer,
          className: "max-w-[360px] truncate",
        }),
      ]}
      searchPlaceholder="Search globals by name, type, file, usage..."
      emptyMessage="No global variables found."
    />
  );
}