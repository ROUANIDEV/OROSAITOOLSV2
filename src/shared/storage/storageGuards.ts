import { hasOwnKey, isRecord } from "../guards";
import type { AppDataDocument } from "./appDataDocument";

export function isAppDataDocument<TData>(
  value: unknown,
  dataGuard: (data: unknown) => data is TData,
): value is AppDataDocument<TData> {
  return (
    isRecord(value) &&
    hasOwnKey(value, "schemaVersion") &&
    typeof value.schemaVersion === "number" &&
    hasOwnKey(value, "key") &&
    typeof value.key === "string" &&
    hasOwnKey(value, "updatedAtMs") &&
    typeof value.updatedAtMs === "number" &&
    hasOwnKey(value, "data") &&
    dataGuard(value.data)
  );
}
