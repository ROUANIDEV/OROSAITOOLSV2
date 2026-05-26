export type StandardEntityUsedValue = boolean | string[] | null | undefined;

export type StandardEntityTableRow = {
  name: string;
  line: number | string;
  relativePath?: string | null;
  file?: string | null;
  usedInSources?: StandardEntityUsedValue;
};

export function getStandardEntityFile(row: {
  relativePath?: string | null;
  file?: string | null;
}) {
  return row.relativePath ?? row.file ?? "—";
}

export function getStandardEntityFileSearch(row: {
  relativePath?: string | null;
  file?: string | null;
}) {
  return row.relativePath ?? row.file ?? "";
}

export function getStandardEntityUsedSearchValue(used: StandardEntityUsedValue) {
  return normalizeStandardEntityUsedValue(used) ? "yes used" : "no unused";
}

export function getStandardEntityUsedFilterValue(used: StandardEntityUsedValue) {
  return normalizeStandardEntityUsedValue(used) ? "Yes" : "No";
}

export function normalizeStandardEntityUsedValue(used: StandardEntityUsedValue) {
  if (Array.isArray(used)) {
    return used.length > 0;
  }

  return used === true;
}