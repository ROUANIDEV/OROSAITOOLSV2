import { StandardEntitySmartTable } from "@/components/smart-table/StandardEntitySmartTable";
import { createSmartTextColumn } from "@/components/smart-table/smartTableColumns";
import type { DataDictionaryDataType } from "@/lib/dataDictionary";

export function DataTypesTable({
  dataTypes,
}: {
  dataTypes: DataDictionaryDataType[];
}) {
  return (
    <StandardEntitySmartTable
      data={dataTypes}
      detailColumns={[
        createSmartTextColumn<DataDictionaryDataType>({
          id: "kind",
          header: "Kind",
          value: (row) => row.kind,
          filterable: true,
        }),
        createSmartTextColumn<DataDictionaryDataType>({
          id: "definition",
          header: "Definition",
          value: (row) => row.definition,
          className: "max-w-[520px] truncate",
        }),
      ]}
      searchPlaceholder="Search data types by name, definition, file, usage..."
      emptyMessage="No data types found."
    />
  );
}