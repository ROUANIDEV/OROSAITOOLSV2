import { useEffect, useRef } from "react";

import type { ToolId } from "@/features/dashboard/tool-config";
import { loadAppSettings } from "@/features/settings/settings-state";

type ExportTimestamp = string | null;

type UseAutoOpenReportsAfterExportArgs = {
  activeTool: ToolId;
  isWorkspaceLoaded: boolean;
  callTreeLastExportedAt: ExportTimestamp;
  dataDictionaryLastExportedAt: ExportTimestamp;
  onOpenReports: () => void;
};

function didExportChange(
  currentExportedAt: ExportTimestamp,
  previousExportedAt: ExportTimestamp,
): boolean {
  return Boolean(currentExportedAt) && currentExportedAt !== previousExportedAt;
}

export function useAutoOpenReportsAfterExport({
  activeTool,
  isWorkspaceLoaded,
  callTreeLastExportedAt,
  dataDictionaryLastExportedAt,
  onOpenReports,
}: UseAutoOpenReportsAfterExportArgs): void {
  const initializedRef = useRef(false);
  const lastCallTreeExportRef = useRef<ExportTimestamp>(null);
  const lastDataDictionaryExportRef = useRef<ExportTimestamp>(null);

  useEffect(() => {
    if (!isWorkspaceLoaded) {
      return;
    }

    const previousCallTreeExport = lastCallTreeExportRef.current;
    const previousDataDictionaryExport = lastDataDictionaryExportRef.current;

    lastCallTreeExportRef.current = callTreeLastExportedAt;
    lastDataDictionaryExportRef.current = dataDictionaryLastExportedAt;

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    const settings = loadAppSettings();

    if (!settings.autoOpenReportsAfterExport) {
      return;
    }

    const callTreeWasExported = didExportChange(
      callTreeLastExportedAt,
      previousCallTreeExport,
    );
    const dataDictionaryWasExported = didExportChange(
      dataDictionaryLastExportedAt,
      previousDataDictionaryExport,
    );

    if (activeTool !== "reports" && (callTreeWasExported || dataDictionaryWasExported)) {
      onOpenReports();
    }
  }, [
    activeTool,
    callTreeLastExportedAt,
    dataDictionaryLastExportedAt,
    isWorkspaceLoaded,
    onOpenReports,
  ]);
}