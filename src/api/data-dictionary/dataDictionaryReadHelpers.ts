import {
  readArray,
  readString,
  type RawRecord,
} from "@/api/shared/rawRecord";

export function readSourcePath(raw: RawRecord): string {
  return readString(raw, [
    "relativePath",
    "relative_path",
    "file",
    "filePath",
    "file_path",
    "path",
    "sourceFile",
    "source_file",
    "sourcePath",
    "source_path",
    "headerFile",
    "header_file",
  ]);
}

export function readFilePath(raw: RawRecord, fallback: string): string {
  return readString(
    raw,
    ["filePath", "file_path", "path", "relativePath", "relative_path", "file"],
    fallback,
  );
}

export function readUsedInSources(raw: RawRecord): string[] {
  return readArray(raw, [
    "usedInSources",
    "used_in_sources",
    "usedIn",
    "used_in",
    "references",
    "referencedBy",
    "referenced_by",
  ])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}