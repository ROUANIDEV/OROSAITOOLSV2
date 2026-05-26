export type EntityId = string;

export function createEntityId(prefix?: string): EntityId {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return prefix ? `${prefix}_${randomId}` : randomId;
}

export function isEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && value.trim().length > 0;
}
