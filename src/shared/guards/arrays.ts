export function isArrayOf<TItem>(
  value: unknown,
  itemGuard: (item: unknown) => item is TItem,
): value is TItem[] {
  return Array.isArray(value) && value.every(itemGuard);
}

export function compact<TItem>(items: readonly (TItem | null | undefined)[]): TItem[] {
  return items.filter((item): item is TItem => item !== null && item !== undefined);
}

export function uniqueBy<TItem, TKey>(
  items: readonly TItem[],
  getKey: (item: TItem) => TKey,
): TItem[] {
  const seenKeys = new Set<TKey>();
  const uniqueItems: TItem[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

export function hasDuplicates<TItem>(items: readonly TItem[]): boolean {
  return new Set(items).size !== items.length;
}
