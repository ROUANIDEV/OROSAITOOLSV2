import { useCallback } from "react";

import { useActiveTool } from "@/app/navigation/useActiveTool";
import { useAutoOpenReportsAfterExport } from "@/app/reports/useAutoOpenReportsAfterExport";
import { useWorkspaceState } from "@/app/workspace/useWorkspaceState";
import { AppDashboard } from "@/features/dashboard";

export default function App() {
  const { activeTool, setActiveTool } = useActiveTool();

  const handleWorkspaceCleared = useCallback(() => {
    setActiveTool("overview");
  }, [setActiveTool]);

  const {
    workspaceStateLoaded,
    cProjectState,
    callTreeState,
    dataDictionaryState,
    setCProjectState,
    setCallTreeState,
    setDataDictionaryState,
  } = useWorkspaceState({
    onWorkspaceCleared: handleWorkspaceCleared,
  });

  const handleOpenReports = useCallback(() => {
    setActiveTool("reports");
  }, [setActiveTool]);

  useAutoOpenReportsAfterExport({
    activeTool,
    isWorkspaceLoaded: workspaceStateLoaded,
    callTreeLastExportedAt: callTreeState.lastExportedAt,
    dataDictionaryLastExportedAt: dataDictionaryState.lastExportedAt,
    onOpenReports: handleOpenReports,
  });

  return (
    <AppDashboard
      activeTool={activeTool}
      onToolChange={setActiveTool}
      cProjectState={cProjectState}
      onCProjectStateChange={setCProjectState}
      callTreeState={callTreeState}
      onCallTreeStateChange={setCallTreeState}
      dataDictionaryState={dataDictionaryState}
      onDataDictionaryStateChange={setDataDictionaryState}
    />
  );
}