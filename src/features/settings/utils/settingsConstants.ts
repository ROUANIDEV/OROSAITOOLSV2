import { Laptop, Moon, Sun } from "lucide-react";

import type { AppSettings } from "@/features/settings/settings-state";

export type RefreshPathStatus = "idle" | "refreshing" | "unchanged";

export const themeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Use a bright interface.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Use a dark interface.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow the operating system.",
    icon: Laptop,
  },
] as const;

export const nativeJsonStorageFiles = [
  "orosaitools.cProjectWorkspaceState.v1.json",
  "orosaitools.callTreeWorkspace.v1.json",
  "orosaitools.dataDictionaryWorkspace.v1.json",
  "orosaitools.crc.history.v1.json",
  "orosaitools.crc.profiles.v1.json",
] as const;

export type PreferenceItem = {
  key: keyof Pick<
    AppSettings,
    "rememberLastTool" | "autoOpenReportsAfterExport" | "compactReportCards"
  >;
  title: string;
  description: string;
  enabled: boolean;
};

export function buildPreferenceItems(settings: AppSettings): PreferenceItem[] {
  return [
    {
      key: "rememberLastTool",
      title: "Remember last opened tool",
      description:
        "Keep the dashboard on the last workspace you used when the app opens again.",
      enabled: settings.rememberLastTool,
    },
    {
      key: "autoOpenReportsAfterExport",
      title: "Open Reports after export",
      description:
        "After generating an Excel report, jump directly to the Reports workspace.",
      enabled: settings.autoOpenReportsAfterExport,
    },
    {
      key: "compactReportCards",
      title: "Compact report cards",
      description:
        "Use smaller report cards when the Reports workspace gets more report types.",
      enabled: settings.compactReportCards,
    },
  ];
}

export function getRefreshButtonText(status: RefreshPathStatus): string {
  if (status === "refreshing") {
    return "Refreshing...";
  }

  if (status === "unchanged") {
    return "Nothing to refresh";
  }

  return "Refresh folder path";
}