import { FolderOpen, Loader2, RotateCcw, ScanSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CProjectScannerActions } from "@/features/c-project/cProjectWorkspaceTypes";

type CProjectScannerActionsBarProps = CProjectScannerActions & {
  hasProjectPath: boolean;
  isPickingFolder: boolean;
  isScanning: boolean;
};

export function CProjectScannerActionsBar({
  hasProjectPath,
  isPickingFolder,
  isScanning,
  onChooseFolder,
  onScanProject,
  onClearScanner,
}: CProjectScannerActionsBarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <Button
        type="button"
        variant="outline"
        onClick={onChooseFolder}
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
        onClick={onScanProject}
        disabled={!hasProjectPath || isScanning}
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
        onClick={onClearScanner}
        disabled={isPickingFolder || isScanning}
        className="lg:w-fit"
      >
        <RotateCcw className="size-4" />
        Clear
      </Button>
    </div>
  );
}