import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  CheckCircle2,
  Clock3,
  FileCode2,
  FolderOpen,
  Loader2,
  RotateCcw,
  ScanSearch,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  emptyCProjectWorkspaceState,
  resetCProjectScanForNewFolder,
  type CProjectWorkspaceState,
} from "@/features/c-project/c-project-state";
import { scanCProjectWorkspace } from "@/lib/cProject";

type CProjectWorkspaceProps = {
  state: CProjectWorkspaceState;
  onStateChange: Dispatch<SetStateAction<CProjectWorkspaceState>>;
};

export function CProjectWorkspace({
  state,
  onStateChange,
}: CProjectWorkspaceProps) {
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  const isScanning = state.status === "scanning";

  const selectedCsc = useMemo(() => {
    return (
      state.cscFolders.find((folder) => folder.path === state.selectedCscPath) ??
      null
    );
  }, [state.cscFolders, state.selectedCscPath]);

  async function handleChooseFolder() {
    try {
      setIsPickingFolder(true);

      onStateChange((current) => ({
        ...current,
        error: null,
      }));

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select C project folder",
      });

      if (typeof selected !== "string") {
        return;
      }

      onStateChange((current) => {
        if (current.projectPath === selected) {
          return current;
        }

        return resetCProjectScanForNewFolder(selected);
      });
    } catch (err) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    } finally {
      setIsPickingFolder(false);
    }
  }

  async function handleScanProject() {
    const projectPath = state.projectPath.trim();

    if (!projectPath) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: "Please choose a project folder first.",
      }));

      return;
    }

    const previousSelectedCscPath = state.selectedCscPath;

    try {
      onStateChange((current) => ({
        ...current,
        status: "scanning",
        error: null,
      }));

      await waitForUiPaint();

      const scanResult = await scanCProjectWorkspace(projectPath);

      onStateChange((current) => {
        const previousSelectionStillExists = scanResult.cscFolders.some(
          (folder) => folder.path === previousSelectedCscPath,
        );

        const nextSelectedCscPath = previousSelectionStillExists
          ? previousSelectedCscPath
          : scanResult.cscFolders[0]?.path ?? null;

        return {
          ...current,
          projectPath,
          summary: scanResult.summary,
          cscFolders: scanResult.cscFolders,
          selectedCscPath: nextSelectedCscPath,
          status: "ready",
          error: null,
          lastScannedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  function handleSelectCsc(path: string) {
    onStateChange((current) => ({
      ...current,
      selectedCscPath: path,
    }));
  }

  function handleClearScanner() {
    onStateChange(emptyCProjectWorkspaceState);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Workspace</Badge>
              <Badge variant="outline">C Project Scanner</Badge>
              <StatusBadge status={state.status} />
            </div>

            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileCode2 className="size-6" />
              C Project Scanner
            </CardTitle>

            <CardDescription>
              Select a C project folder, scan files, and detect CSC folders for
              the other tools. The scan result is remembered when you navigate
              away.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChooseFolder}
                  disabled={isPickingFolder || isScanning}
                  className="lg:w-fit"
                >
                  {isPickingFolder ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FolderOpen className="size-4" />
                  )}
                  Choose folder
                </Button>

                <Button
                  type="button"
                  onClick={handleScanProject}
                  disabled={!state.projectPath || isScanning}
                  className="lg:w-fit"
                >
                  {isScanning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ScanSearch className="size-4" />
                  )}
                  {isScanning ? "Scanning..." : "Scan project"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearScanner}
                  disabled={isPickingFolder || isScanning}
                  className="lg:w-fit"
                >
                  <RotateCcw className="size-4" />
                  Clear
                </Button>
              </div>

              <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                <span className="font-medium">Project path: </span>
                <span className="break-all text-muted-foreground">
                  {state.projectPath || "No folder selected yet"}
                </span>
              </div>

              {state.lastScannedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  Last scan: {formatDateTime(state.lastScannedAt)}
                </div>
              )}
            </div>

            {isScanning && (
              <Alert>
                <Loader2 className="size-4 animate-spin" />
                <AlertTitle>Scanning project in background</AlertTitle>
                <AlertDescription>
                  You can keep using the UI. The previous scan result stays
                  visible until the new scan finishes.
                </AlertDescription>
              </Alert>
            )}

            {state.error && (
              <Alert variant="destructive">
                <AlertTitle>Scanner error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state.summary && (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total files" value={state.summary.totalFiles} />
                <StatCard label="C/C++ files" value={state.summary.cFiles} />
                <StatCard
                  label="Header files"
                  value={state.summary.headerFiles}
                />
                <StatCard
                  label="CSC folders"
                  value={state.cscFolders.length}
                />
              </section>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Detected CSC folders
                </CardTitle>
                <CardDescription>
                  Select the CSC that Call Tree and Data Dictionary should use.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4">
                {state.cscFolders.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No CSC folders detected yet.
                  </div>
                ) : (
                  <>
                    <Select
                      value={state.selectedCscPath ?? undefined}
                      onValueChange={handleSelectCsc}
                      disabled={isScanning}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select CSC folder" />
                      </SelectTrigger>

                      <SelectContent>
                        {state.cscFolders.map((folder) => (
                          <SelectItem key={folder.path} value={folder.path}>
                            {folder.relativePath || folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="rounded-lg border">
                      <Table>
                        <TableBody>
                          {state.cscFolders.map((folder) => (
                            <TableRow
                              key={folder.path}
                              className={
                                state.selectedCscPath === folder.path
                                  ? "bg-muted/60"
                                  : ""
                              }
                            >
                              <TableCell className="font-medium">
                                <button
                                  type="button"
                                  onClick={() => handleSelectCsc(folder.path)}
                                  disabled={isScanning}
                                  className="flex w-full items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {state.selectedCscPath === folder.path && (
                                    <CheckCircle2 className="size-4 text-primary" />
                                  )}

                                  <span className="break-all">
                                    {folder.relativePath || folder.name}
                                  </span>
                                </button>
                              </TableCell>

                              <TableCell className="text-right text-muted-foreground">
                                {folder.cFiles} C / {folder.headerFiles} H
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected CSC</CardTitle>
            <CardDescription>
              This selection is shared with the next tools.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {selectedCsc ? (
              <>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">{selectedCsc.name}</p>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {selectedCsc.path}
                  </p>
                </div>

                <div className="grid gap-3 text-sm">
                  <InfoRow label="C/C++ files" value={selectedCsc.cFiles} />
                  <InfoRow
                    label="Header files"
                    value={selectedCsc.headerFiles}
                  />
                  <InfoRow
                    label="Sources path"
                    value={selectedCsc.sourcesPath ?? "Not detected"}
                  />
                  <InfoRow
                    label="Include path"
                    value={selectedCsc.includePath ?? "Not detected"}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No CSC selected yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: CProjectWorkspaceState["status"] }) {
  if (status === "scanning") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        Scanning
      </Badge>
    );
  }

  if (status === "ready") {
    return <Badge variant="secondary">Ready</Badge>;
  }

  if (status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }

  return <Badge variant="outline">Idle</Badge>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid gap-1 rounded-lg border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-all font-medium">{value}</span>
    </div>
  );
}

function waitForUiPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}