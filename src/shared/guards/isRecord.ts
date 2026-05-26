export type UnknownRecord = Record<PropertyKey, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasOwnKey<TKey extends PropertyKey>(
  value: unknown,
  key: TKey,
): value is UnknownRecord & Record<TKey, unknown> {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}
