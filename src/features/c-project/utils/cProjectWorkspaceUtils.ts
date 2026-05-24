import type { CscFolder } from "@/lib/cProject";

export function waitForUiPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function findSelectedCsc(
  cscFolders: CscFolder[],
  selectedCscPath: string | null,
): CscFolder | null {
  return cscFolders.find((folder) => folder.path === selectedCscPath) ?? null;
}

export function pickNextSelectedCscPath(
  cscFolders: CscFolder[],
  previousSelectedCscPath: string | null,
): string | null {
  const previousSelectionStillExists = cscFolders.some(
    (folder) => folder.path === previousSelectedCscPath,
  );

  if (previousSelectionStillExists) {
    return previousSelectedCscPath;
  }

  return cscFolders[0]?.path ?? null;
}