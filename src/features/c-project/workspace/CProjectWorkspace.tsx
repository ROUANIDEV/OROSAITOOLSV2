import { useMemo } from "react";

import { CProjectScannerCard } from "@/features/c-project/workspace/CProjectScannerCard";
import { CProjectSelectedCscCard } from "@/features/c-project/csc/CProjectSelectedCscCard";
import type { CProjectWorkspaceProps } from "@/features/c-project/state/cProjectWorkspaceTypes";
import { findSelectedCsc } from "@/features/c-project/domain/cProjectWorkspaceUtils";
import { useCProjectScannerActions } from "@/features/c-project/state/useCProjectScannerActions";

export function CProjectWorkspace({
  state,
  onStateChange,
}: CProjectWorkspaceProps) {
  const isScanning = state.status === "scanning";

  const selectedCsc = useMemo(
    () => findSelectedCsc(state.cscFolders, state.selectedCscPath),
    [state.cscFolders, state.selectedCscPath],
  );

  const {
    isPickingFolder,
    handleChooseFolder,
    handleScanProject,
    handleSelectCsc,
    handleClearScanner,
  } = useCProjectScannerActions({
    state,
    onStateChange,
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <CProjectScannerCard
          state={state}
          isPickingFolder={isPickingFolder}
          isScanning={isScanning}
          onChooseFolder={handleChooseFolder}
          onScanProject={handleScanProject}
          onClearScanner={handleClearScanner}
          onSelectCsc={handleSelectCsc}
        />

        <CProjectSelectedCscCard selectedCsc={selectedCsc} />
      </section>
    </main>
  );
}