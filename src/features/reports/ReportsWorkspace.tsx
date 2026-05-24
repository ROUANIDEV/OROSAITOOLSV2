import { useState, type ComponentType } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Check,
  Copy,
  FileSpreadsheet,
  FolderOpen,
  GitBranch,
  Network,
  RefreshCw,
  Search,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import type { ToolId } from "@/features/dashboard/tool-config";
import { loadAppSettings } from "@/features/settings/settings-state";
import { revealPathInFileManager } from "@/lib/reports";

type ReportStatus = "generated" | "analyzed" | "waiting";

type ReportFilter = "all" | ReportStatus;

type ReportMetric = {
  label: string;
  value: number | "—";
};

type ReportDetails = {
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
  actionTool: Extract<ToolId, "call-tree" | "data-dictionary">;
  actionLabel: string;
  error: string | null;
};

type CopyStatus = {
  reportId: string;
  status: "copied" | "failed";
} | null;

type OpenStatus = {
  reportId: string;
  status: "opened" | "failed";
  message?: string;
} | null;

type ReportsFolderStatus = {
  status: "opened" | "failed";
  message?: string;
} | null;

type ReportsWorkspaceProps = {
  selectedCscPath: string | null;
  callTreeState: CallTreeWorkspaceState;
  dataDictionaryState: DataDictionaryWorkspaceState;
  onToolChange: (tool: ToolId) => void;
};

function buildExpectedReportPath(
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

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function numberOrDash(value: number | null | undefined): number | "—" {
  return typeof value === "number" ? value : "—";
}

function getStatusBadgeVariant(
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

function reportMatchesSearch(report: ReportDetails, searchQuery: string) {
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

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Continue to fallback copy method.
  }

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

export function ReportsWorkspace({
  selectedCscPath,
  callTreeState,
  dataDictionaryState,
  onToolChange,
}: ReportsWorkspaceProps) {
  const { compactReportCards } = loadAppSettings();

  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [openStatus, setOpenStatus] = useState<OpenStatus>(null);
  const [reportsFolderStatus, setReportsFolderStatus] =
    useState<ReportsFolderStatus>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportFilter>("all");

  const expectedCallTreePath = buildExpectedReportPath(
    selectedCscPath,
    "call_tree.xlsx",
  );

  const expectedDataDictionaryPath = buildExpectedReportPath(
    selectedCscPath,
    "data_dictionnary.xlsx",
  );

  async function handleCopyPath(report: ReportDetails) {
    if (!report.outputPath) {
      return;
    }

    const didCopy = await copyTextToClipboard(report.outputPath);

    setCopyStatus({
      reportId: report.id,
      status: didCopy ? "copied" : "failed",
    });

    window.setTimeout(() => {
      setCopyStatus((currentStatus) =>
        currentStatus?.reportId === report.id ? null : currentStatus,
      );
    }, 2200);
  }

  async function handleOpenFolder(report: ReportDetails) {
    if (!report.outputPath) {
      return;
    }

    try {
      await revealPathInFileManager(report.outputPath);

      setOpenStatus({
        reportId: report.id,
        status: "opened",
      });
    } catch (error) {
      setOpenStatus({
        reportId: report.id,
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }

    window.setTimeout(() => {
      setOpenStatus((currentStatus) =>
        currentStatus?.reportId === report.id ? null : currentStatus,
      );
    }, 3000);
  }

  async function handleOpenReportsFolder() {
    if (!selectedCscPath) {
      return;
    }

    try {
      await revealPathInFileManager(selectedCscPath);

      setReportsFolderStatus({
        status: "opened",
      });
    } catch (error) {
      setReportsFolderStatus({
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }

    window.setTimeout(() => {
      setReportsFolderStatus(null);
    }, 3000);
  }

  const reports: ReportDetails[] = [
    {
      id: "call-tree",
      title: "Call Tree",
      fileName: "call_tree.xlsx",
      description:
        "Function relationship report generated from the selected CSC source files.",
      icon: GitBranch,
      status: callTreeState.exportResult
        ? "generated"
        : callTreeState.analysis
          ? "analyzed"
          : "waiting",
      statusLabel: callTreeState.exportResult
        ? "Generated"
        : callTreeState.analysis
          ? "Analysis ready"
          : "Not generated",
      outputPath: callTreeState.exportResult?.outputPath ?? expectedCallTreePath,
      metrics: [
        {
          label: "Functions",
          value: numberOrDash(
            callTreeState.exportResult?.functionCount ??
              callTreeState.analysis?.functionCount,
          ),
        },
        {
          label: "Calls",
          value: numberOrDash(
            callTreeState.exportResult?.callCount ??
              callTreeState.analysis?.callCount,
          ),
        },
        {
          label: "Root functions",
          value: numberOrDash(
            callTreeState.exportResult?.rootFunctionCount ??
              callTreeState.analysis?.rootFunctionCount,
          ),
        },
      ],
      updatedAt: callTreeState.lastExportedAt ?? callTreeState.lastAnalyzedAt,
      actionTool: "call-tree",
      actionLabel: "Open Call Tree",
      error: callTreeState.error,
    },
    {
      id: "data-dictionary",
      title: "Data Dictionary",
      fileName: "data_dictionnary.xlsx",
      description:
        "Constants, globals, data types, and macros report generated from CSC headers.",
      icon: BookOpen,
      status: dataDictionaryState.exportResult
        ? "generated"
        : dataDictionaryState.analysis
          ? "analyzed"
          : "waiting",
      statusLabel: dataDictionaryState.exportResult
        ? "Generated"
        : dataDictionaryState.analysis
          ? "Analysis ready"
          : "Not generated",
      outputPath:
        dataDictionaryState.exportResult?.outputPath ??
        expectedDataDictionaryPath,
      metrics: [
        {
          label: "Constants",
          value: numberOrDash(
            dataDictionaryState.exportResult?.constantsCount ??
              dataDictionaryState.analysis?.constantsCount,
          ),
        },
        {
          label: "Globals",
          value: numberOrDash(
            dataDictionaryState.exportResult?.globalVariablesCount ??
              dataDictionaryState.analysis?.globalVariablesCount,
          ),
        },
        {
          label: "Data types",
          value: numberOrDash(
            dataDictionaryState.exportResult?.dataTypesCount ??
              dataDictionaryState.analysis?.dataTypesCount,
          ),
        },
      ],
      updatedAt:
        dataDictionaryState.lastExportedAt ??
        dataDictionaryState.lastAnalyzedAt,
      actionTool: "data-dictionary",
      actionLabel: "Open Data Dictionary",
      error: dataDictionaryState.error,
    },
  ];

  const generatedReportsCount = reports.filter(
    (report) => report.status === "generated",
  ).length;

  const analyzedReportsCount = reports.filter(
    (report) => report.status === "analyzed",
  ).length;

  const waitingReportsCount = reports.filter(
    (report) => report.status === "waiting",
  ).length;

  const readyReportsCount = reports.filter(
    (report) => report.status !== "waiting",
  ).length;

  const visibleReports = reports.filter((report) => {
    const matchesFilter =
      statusFilter === "all" ? true : report.status === statusFilter;

    return matchesFilter && reportMatchesSearch(report, searchQuery);
  });

  const filterOptions: Array<{
    value: ReportFilter;
    label: string;
    count: number;
  }> = [
    {
      value: "all",
      label: "All",
      count: reports.length,
    },
    {
      value: "generated",
      label: "Generated",
      count: generatedReportsCount,
    },
    {
      value: "analyzed",
      label: "Analysis ready",
      count: analyzedReportsCount,
    },
    {
      value: "waiting",
      label: "Not generated",
      count: waitingReportsCount,
    },
  ];

  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Workspace</Badge>
            <Badge variant="outline">Reports</Badge>
            <Badge variant="outline">
              {generatedReportsCount}/{reports.length} generated
            </Badge>
            <Badge variant="outline">
              {compactReportCards ? "Compact mode" : "Comfort mode"}
            </Badge>
          </div>

          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileSpreadsheet className="h-6 w-6" />
            Reports
          </CardTitle>

          <CardDescription>
            Review the Excel reports generated from the selected CSC folder,
            copy output paths, open report folders, and jump back to the tool
            that creates each report.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5">
          {!selectedCscPath ? (
            <Alert>
              <Network className="h-4 w-4" />
              <AlertTitle>No CSC folder selected</AlertTitle>
              <AlertDescription>
                Select a CSC folder first so the reports workspace can show the
                expected output paths.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Current CSC folder
              </p>
              <p className="mt-1 break-all font-mono text-sm">
                {selectedCscPath}
              </p>
            </div>
          )}

          {reportsFolderStatus?.status === "failed" ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Open reports folder failed</AlertTitle>
              <AlertDescription>
                {reportsFolderStatus.message ??
                  "The selected CSC folder could not be opened."}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                Report types
              </div>
              <p className="mt-2 text-2xl font-semibold">{reports.length}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Ready reports
              </div>
              <p className="mt-2 text-2xl font-semibold">{readyReportsCount}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                Generated files
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {generatedReportsCount}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => onToolChange("c-project")}>
              Select CSC Folder
            </Button>

            <Button
              variant="outline"
              disabled={!selectedCscPath}
              onClick={() => void handleOpenReportsFolder()}
            >
              {reportsFolderStatus?.status === "opened" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Opened
                </>
              ) : (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open reports folder
                </>
              )}
            </Button>

            <Button variant="outline" onClick={() => onToolChange("call-tree")}>
              Open Call Tree
            </Button>

            <Button
              variant="outline"
              onClick={() => onToolChange("data-dictionary")}
            >
              Open Data Dictionary
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-5 w-5" />
            Find reports
          </CardTitle>

          <CardDescription>
            Filter report cards by status or search by name, file name,
            description, or output path.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search reports..."
          />

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
                <Badge className="ml-2" variant="secondary">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {visibleReports.length} of {reports.length} report
            {reports.length === 1 ? "" : "s"}.
          </p>
        </CardContent>
      </Card>

      {visibleReports.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5" />
              No matching reports
            </CardTitle>

            <CardDescription>
              Clear the search text or switch the status filter back to All.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            compactReportCards
              ? "grid gap-3 xl:grid-cols-2 2xl:grid-cols-3"
              : "grid gap-4 lg:grid-cols-2"
          }
        >
          {visibleReports.map((report) => {
            const Icon = report.icon;

            const currentCopyStatus =
              copyStatus?.reportId === report.id ? copyStatus.status : null;

            const currentOpenStatus =
              openStatus?.reportId === report.id ? openStatus : null;

            return (
              <Card key={report.id}>
                <CardHeader
                  className={compactReportCards ? "pb-3" : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border bg-muted/40 p-2">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <CardTitle className="text-base">
                          {report.title}
                        </CardTitle>
                        <CardDescription>{report.fileName}</CardDescription>
                      </div>
                    </div>

                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.statusLabel}
                    </Badge>
                  </div>

                  {!compactReportCards ? (
                    <CardDescription>{report.description}</CardDescription>
                  ) : null}
                </CardHeader>

                <CardContent
                  className={compactReportCards ? "grid gap-3" : "grid gap-4"}
                >
                  {report.error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Last error</AlertTitle>
                      <AlertDescription>{report.error}</AlertDescription>
                    </Alert>
                  ) : null}

                  {currentCopyStatus === "failed" ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Copy failed</AlertTitle>
                      <AlertDescription>
                        The path could not be copied. You can still select it
                        manually from the output path field.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {currentOpenStatus?.status === "failed" ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Open folder failed</AlertTitle>
                      <AlertDescription>
                        {currentOpenStatus.message ??
                          "The report location could not be opened."}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div
                    className={
                      compactReportCards
                        ? "grid gap-2"
                        : "grid gap-3 sm:grid-cols-3"
                    }
                  >
                    {report.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {!compactReportCards ? (
                    <div className="grid gap-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Output path
                      </p>
                      <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
                        {report.outputPath ??
                          "Generate this report first to see the output path."}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Updated: {formatDateTime(report.updatedAt)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size={compactReportCards ? "sm" : "default"}
                        disabled={!report.outputPath}
                        onClick={() => void handleCopyPath(report)}
                      >
                        {currentCopyStatus === "copied" ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy path
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size={compactReportCards ? "sm" : "default"}
                        disabled={!report.outputPath}
                        onClick={() => void handleOpenFolder(report)}
                      >
                        {currentOpenStatus?.status === "opened" ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Opened
                          </>
                        ) : (
                          <>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Open folder
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size={compactReportCards ? "sm" : "default"}
                        onClick={() => onToolChange(report.actionTool)}
                      >
                        {report.actionLabel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Step status</CardTitle>
          <CardDescription>
            Reports now includes search, status filters, and a no-results state
            while keeping copy path and open folder actions.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}