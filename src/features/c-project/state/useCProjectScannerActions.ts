import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

import {
  emptyCProjectWorkspaceState,
  resetCProjectScanForNewFolder,
} from "@/features/c-project/state/cProjectWorkspaceState";
import type { CProjectWorkspaceProps } from "@/features/c-project/state/cProjectWorkspaceTypes";
import {
  pickNextSelectedCscPath,
  waitForUiPaint,
} from "@/features/c-project/domain/cProjectWorkspaceUtils";
import { scanCProjectWorkspace } from "@/lib/cProject";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useCProjectScannerActions({
  state,
  onStateChange,
}: CProjectWorkspaceProps) {
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  async function handleChooseFolder() {
    try {
      setIsPickingFolder(true);
      onStateChange((current) => ({ ...current, error: null }));

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
    } catch (error) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: getErrorMessage(error),
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

      onStateChange((current) => ({
        ...current,
        projectPath,
        summary: scanResult.summary,
        cscFolders: scanResult.cscFolders,
        selectedCscPath: pickNextSelectedCscPath(
          scanResult.cscFolders,
          previousSelectedCscPath,
        ),
        status: "ready",
        error: null,
        lastScannedAt: new Date().toISOString(),
      }));
    } catch (error) {
      onStateChange((current) => ({
        ...current,
        status: "error",
        error: getErrorMessage(error),
      }));
    }
  }

  function handleSelectCsc(path: string) {
    onStateChange((current) => ({ ...current, selectedCscPath: path }));
  }

  function handleClearScanner() {
    onStateChange(emptyCProjectWorkspaceState);
  }

  return {
    isPickingFolder,
    handleChooseFolder,
    handleScanProject,
    handleSelectCsc,
    handleClearScanner,
  };
}