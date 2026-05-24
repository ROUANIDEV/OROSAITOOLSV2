import { Badge } from "@/components/ui/badge";

type UsedValue = boolean | string[] | null | undefined;

export function DataDictionaryUsedBadge({ used }: { used: UsedValue }) {
  const isUsed = normalizeUsedValue(used);

  return (
    <Badge variant={isUsed ? "secondary" : "outline"}>
      {isUsed ? "Yes" : "No"}
    </Badge>
  );
}

export function getDataDictionaryFile(row: {
  relativePath?: string | null;
  file?: string | null;
}) {
  return row.relativePath ?? row.file ?? "—";
}

export function getDataDictionaryFileSearch(row: {
  relativePath?: string | null;
  file?: string | null;
}) {
  return row.relativePath ?? row.file ?? "";
}

export function getUsedSearchValue(used: UsedValue) {
  return normalizeUsedValue(used) ? "yes used" : "no unused";
}

export function getUsedFilterValue(used: UsedValue) {
  return normalizeUsedValue(used) ? "Yes" : "No";
}

function normalizeUsedValue(used: UsedValue) {
  if (Array.isArray(used)) {
    return used.length > 0;
  }

  return used === true;
}