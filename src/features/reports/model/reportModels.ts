import { CallTreeWorkspaceState } from "@/features/call-tree";
import { DataDictionaryWorkspaceState } from "@/features/data-dictionary";
import { BookOpen, GitBranch } from "lucide-react";
import { ReportDetails } from "./reportsTypes";
import { buildExpectedReportPath, numberOrDash } from "./reportsUtils";

type BuildReportsArgs = {
  selectedCscPath: string | null;
  callTreeState: CallTreeWorkspaceState;
  dataDictionaryState: DataDictionaryWorkspaceState;
};

export function buildReports({
  selectedCscPath,
  callTreeState,
  dataDictionaryState,
}: BuildReportsArgs): ReportDetails[] {
  return [
    buildCallTreeReport(selectedCscPath, callTreeState),
    buildDataDictionaryReport(selectedCscPath, dataDictionaryState),
  ];
}

function buildCallTreeReport(
  selectedCscPath: string | null,
  state: CallTreeWorkspaceState,
): ReportDetails {
  return {
    id: "call-tree",
    title: "Call Tree",
    fileName: "call_tree.xlsx",
    description:
      "Function relationship report generated from the selected CSC source files.",
    icon: GitBranch,
    status: state.exportResult ? "generated" : state.analysis ? "analyzed" : "waiting",
    statusLabel: state.exportResult
      ? "Generated"
      : state.analysis
        ? "Analysis ready"
        : "Not generated",
    outputPath:
      state.exportResult?.outputPath ??
      buildExpectedReportPath(selectedCscPath, "call_tree.xlsx"),
    metrics: [
      {
        label: "Functions",
        value: numberOrDash(
          state.exportResult?.functionCount ?? state.analysis?.functionCount,
        ),
      },
      {
        label: "Calls",
        value: numberOrDash(
          state.exportResult?.callCount ?? state.analysis?.callCount,
        ),
      },
      {
        label: "Root functions",
        value: numberOrDash(
          state.exportResult?.rootFunctionCount ??
            state.analysis?.rootFunctionCount,
        ),
      },
    ],
    updatedAt: state.lastExportedAt ?? state.lastAnalyzedAt,
    actionTool: "call-tree",
    actionLabel: "Open Call Tree",
    error: state.error,
  };
}

function buildDataDictionaryReport(
  selectedCscPath: string | null,
  state: DataDictionaryWorkspaceState,
): ReportDetails {
  return {
    id: "data-dictionary",
    title: "Data Dictionary",
    fileName: "data_dictionnary.xlsx",
    description:
      "Constants, globals, data types, and macros report generated from CSC headers.",
    icon: BookOpen,
    status: state.exportResult ? "generated" : state.analysis ? "analyzed" : "waiting",
    statusLabel: state.exportResult
      ? "Generated"
      : state.analysis
        ? "Analysis ready"
        : "Not generated",
    outputPath:
      state.exportResult?.outputPath ??
      buildExpectedReportPath(selectedCscPath, "data_dictionnary.xlsx"),
    metrics: [
      {
        label: "Constants",
        value: numberOrDash(
          state.exportResult?.constantsCount ?? state.analysis?.constantsCount,
        ),
      },
      {
        label: "Globals",
        value: numberOrDash(
          state.exportResult?.globalVariablesCount ??
            state.analysis?.globalVariablesCount,
        ),
      },
      {
        label: "Data types",
        value: numberOrDash(
          state.exportResult?.dataTypesCount ?? state.analysis?.dataTypesCount,
        ),
      },
    ],
    updatedAt: state.lastExportedAt ?? state.lastAnalyzedAt,
    actionTool: "data-dictionary",
    actionLabel: "Open Data Dictionary",
    error: state.error,
  };
}