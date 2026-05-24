import { useState } from "react";

import type {
  CopyStatus,
  OpenStatus,
  ReportDetails,
  ReportsFolderStatus,
} from "@/features/reports/types/reportsTypes";
import { copyTextToClipboard } from "@/features/reports/utils/reportsUtils";
import { revealPathInFileManager } from "@/lib/reports";

type UseReportsActionsArgs = {
  selectedCscPath: string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useReportsActions({
  selectedCscPath,
}: UseReportsActionsArgs) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [openStatus, setOpenStatus] = useState<OpenStatus>(null);
  const [reportsFolderStatus, setReportsFolderStatus] =
    useState<ReportsFolderStatus>(null);

  async function handleCopyPath(report: ReportDetails): Promise<void> {
    if (!report.outputPath) {
      return;
    }

    const didCopy = await copyTextToClipboard(report.outputPath);

    setCopyStatus({
      reportId: report.id,
      status: didCopy ? "copied" : "failed",
    });

    window.setTimeout(() => {
      setCopyStatus((current) =>
        current?.reportId === report.id ? null : current,
      );
    }, 2200);
  }

  async function handleOpenFolder(report: ReportDetails): Promise<void> {
    if (!report.outputPath) {
      return;
    }

    try {
      await revealPathInFileManager(report.outputPath);
      setOpenStatus({ reportId: report.id, status: "opened" });
    } catch (error) {
      setOpenStatus({
        reportId: report.id,
        status: "failed",
        message: getErrorMessage(error),
      });
    }

    window.setTimeout(() => {
      setOpenStatus((current) =>
        current?.reportId === report.id ? null : current,
      );
    }, 3000);
  }

  async function handleOpenReportsFolder(): Promise<void> {
    if (!selectedCscPath) {
      return;
    }

    try {
      await revealPathInFileManager(selectedCscPath);
      setReportsFolderStatus({ status: "opened" });
    } catch (error) {
      setReportsFolderStatus({
        status: "failed",
        message: getErrorMessage(error),
      });
    }

    window.setTimeout(() => {
      setReportsFolderStatus(null);
    }, 3000);
  }

  return {
    copyStatus,
    openStatus,
    reportsFolderStatus,
    handleCopyPath,
    handleOpenFolder,
    handleOpenReportsFolder,
  };
}