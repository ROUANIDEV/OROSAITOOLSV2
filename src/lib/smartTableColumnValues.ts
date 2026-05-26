export type SmartColumnValue = string | number | boolean | null | undefined;

export function getSmartColumnDisplayValue(
  value: SmartColumnValue,
  emptyValue = "—",
) {
  if (value === null || value === undefined || value === "") {
    return emptyValue;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

export function getSmartColumnSearchValue(value: SmartColumnValue) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  return String(value);
}