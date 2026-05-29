import { CallTreeWorkspaceState } from "@/features/call-tree";
import { ToolId } from "@/features/dashboard";
import { DataDictionaryWorkspaceState } from "@/features/data-dictionary";
import type { ComponentType } from "react";

export type ReportStatus = "generated" | "analyzed" | "waiting";

export type ReportFilter = "all" | ReportStatus;

export type ReportMetric = {
  label: string;
  value: number | "—";
};

export type ReportActionTool = Extract<
  ToolId,
  "call-tree" | "data-dictionary"
>;

export type ReportDetails = {
  id: string;
  title: string;
  fileName: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  status: ReportStatus;
  statusLabel: string;
  outputPath: string | null;
  metrics: ReportMetric[];
  updatedAt: string | null;
  actionTool: ReportActionTool;
  actionLabel: string;
  error: string | null;
};

export type CopyStatus = {
  reportId: string;
  status: "copied" | "failed";
} | null;

export type OpenStatus = {
  reportId: string;
  status: "opened" | "failed";
  message?: string;
} | null;

export type ReportsFolderStatus = {
  status: "opened" | "failed";
  message?: string;
} | null;

export type ReportsWorkspaceProps = {
  selectedCscPath: string | null;
  callTreeState: CallTreeWorkspaceState;
  dataDictionaryState: DataDictionaryWorkspaceState;
  onToolChange: (tool: ToolId) => void;
};