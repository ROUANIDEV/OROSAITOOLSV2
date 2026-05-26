import type { SmartDataTableColumn } from "@/components/smart-table/SmartDataTable";
import { Badge } from "@/components/ui/badge";
import {
  getSmartColumnDisplayValue,
  getSmartColumnSearchValue,
  type SmartColumnValue,
} from "@/lib/smartTableColumnValues";

type CreateSmartTextColumnOptions<T> = {
  id: string;
  header: string;
  value: (row: T) => SmartColumnValue;
  emphasized?: boolean;
  className?: string;
  filterable?: boolean;
  emptyValue?: string;
};

type CreateSmartBadgeColumnOptions<T> = {
  id: string;
  header: string;
  isActive: (row: T) => boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  activeSearchValue?: string;
  inactiveSearchValue?: string;
  activeFilterValue?: string;
  inactiveFilterValue?: string;
};

export function createSmartTextColumn<T>({
  id,
  header,
  value,
  emphasized = false,
  className,
  filterable = false,
  emptyValue = "—",
}: CreateSmartTextColumnOptions<T>): SmartDataTableColumn<T> {
  return {
    id,
    header,
    accessor: (row) => {
      const displayValue = getSmartColumnDisplayValue(value(row), emptyValue);

      if (emphasized) {
        return <span className="font-medium">{displayValue}</span>;
      }

      return displayValue;
    },
    searchValue: (row) => getSmartColumnSearchValue(value(row)),
    filterValue: filterable ? (row) => getSmartColumnSearchValue(value(row)) : undefined,
    className,
  };
}

export function createSmartBadgeColumn<T>({
  id,
  header,
  isActive,
  activeLabel = "Yes",
  inactiveLabel = "No",
  activeSearchValue,
  inactiveSearchValue,
  activeFilterValue,
  inactiveFilterValue,
}: CreateSmartBadgeColumnOptions<T>): SmartDataTableColumn<T> {
  return {
    id,
    header,
    accessor: (row) => {
      const active = isActive(row);

      return (
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? activeLabel : inactiveLabel}
        </Badge>
      );
    },
    searchValue: (row) => {
      return isActive(row)
        ? activeSearchValue ?? activeLabel
        : inactiveSearchValue ?? inactiveLabel;
    },
    filterValue: (row) => {
      return isActive(row)
        ? activeFilterValue ?? activeLabel
        : inactiveFilterValue ?? inactiveLabel;
    },
  };
}