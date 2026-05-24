import type {
  ReportDetails,
  ReportStatus,
} from "@/features/reports/types/reportsTypes";

export function buildExpectedReportPath(
  selectedCscPath: string | null,
  fileName: string,
): string | null {
  if (!selectedCscPath?.trim()) {
    return null;
  }

  const cleanPath = selectedCscPath.replace(/[\\/]+$/, "");
  const separator = cleanPath.includes("\\") ? "\\" : "/";

  return `${cleanPath}${separator}${fileName}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function numberOrDash(value: number | null | undefined): number | "—" {
  return typeof value === "number" ? value : "—";
}

export function getStatusBadgeVariant(
  status: ReportStatus,
): "default" | "secondary" | "outline" {
  if (status === "generated") {
    return "default";
  }

  if (status === "analyzed") {
    return "secondary";
  }

  return "outline";
}

export function reportMatchesSearch(
  report: ReportDetails,
  searchQuery: string,
): boolean {
  const cleanSearchQuery = searchQuery.trim().toLowerCase();

  if (!cleanSearchQuery) {
    return true;
  }

  const searchableText = [
    report.title,
    report.fileName,
    report.description,
    report.statusLabel,
    report.outputPath ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(cleanSearchQuery);
}

export async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fallback below.
  }

  return copyTextWithTextarea(value);
}

function copyTextWithTextarea(value: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}