export type EntityWithId<TId extends PropertyKey = string> = {
  id: TId;
};

export function findEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  id: TId,
): TEntity | undefined {
  return entities.find((entity) => entity.id === id);
}

export function upsertEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  entity: TEntity,
): TEntity[] {
  const existingIndex = entities.findIndex((item) => item.id === entity.id);

  if (existingIndex === -1) {
    return [...entities, entity];
  }

  return entities.map((item, index) => (index === existingIndex ? entity : item));
}

export function removeEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  id: TId,
): TEntity[] {
  return entities.filter((entity) => entity.id !== id);
}

export function replaceEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  id: TId,
  updateEntity: (entity: TEntity) => TEntity,
): TEntity[] {
  return entities.map((entity) => (entity.id === id ? updateEntity(entity) : entity));
}
