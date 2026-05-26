export type EntitySelection<TId extends PropertyKey = string> = ReadonlySet<TId>;

export function createEmptySelection<TId extends PropertyKey = string>(): EntitySelection<TId> {
  return new Set<TId>();
}

export function selectOnly<TId extends PropertyKey>(id: TId): EntitySelection<TId> {
  return new Set([id]);
}

export function toggleSelection<TId extends PropertyKey>(
  selection: EntitySelection<TId>,
  id: TId,
): EntitySelection<TId> {
  const nextSelection = new Set(selection);

  if (nextSelection.has(id)) {
    nextSelection.delete(id);
  } else {
    nextSelection.add(id);
  }

  return nextSelection;
}

export function removeFromSelection<TId extends PropertyKey>(
  selection: EntitySelection<TId>,
  id: TId,
): EntitySelection<TId> {
  const nextSelection = new Set(selection);
  nextSelection.delete(id);
  return nextSelection;
}

export function selectionToArray<TId extends PropertyKey>(
  selection: EntitySelection<TId>,
): TId[] {
  return [...selection];
}
