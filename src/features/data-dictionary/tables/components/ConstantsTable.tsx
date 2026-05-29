import { StandardEntitySmartTable } from "@/components/smart-table/StandardEntitySmartTable";
import { createSmartTextColumn } from "@/components/smart-table/smartTableColumns";
import type { DataDictionaryConstant } from "@/lib/dataDictionary";

export function ConstantsTable({
  constants,
}: {
  constants: DataDictionaryConstant[];
}) {
  return (
    <StandardEntitySmartTable
      data={constants}
      detailColumns={[
        createSmartTextColumn<DataDictionaryConstant>({
          id: "kind",
          header: "Kind",
          value: (row) => row.kind,
          filterable: true,
        }),
        createSmartTextColumn<DataDictionaryConstant>({
          id: "value",
          header: "Value",
          value: (row) => row.value,
          className: "max-w-[420px] truncate",
        }),
      ]}
      searchPlaceholder="Search constants by name, value, file, usage..."
      emptyMessage="No constants found."
    />
  );
}