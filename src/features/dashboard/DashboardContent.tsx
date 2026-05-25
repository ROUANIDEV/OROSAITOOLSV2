import { CallTreeWorkspace } from "@/features/call-tree/CallTreeWorkspace";
import { CProjectWorkspace } from "@/features/c-project/CProjectWorkspace";
import { CrcCalculatorWorkspace } from "@/features/crc/CrcCalculatorWorkspace";
import { isCustomToolRouteId } from "@/features/custom-tools/registry/customToolRoute";
import { CustomToolRunnerWorkspace } from "@/features/custom-tools/runner/CustomToolRunnerWorkspace";
import { CustomToolBuilderWorkspace } from "@/features/custom-tools/CustomToolBuilderWorkspace";
import { DataDictionaryWorkspace } from "@/features/data-dictionary/DataDictionaryWorkspace";
import type { DashboardContentProps } from "@/features/dashboard/dashboardTypes";
import { getToolById } from "@/features/dashboard/dashboardToolSelectors";
import { DashboardOverview } from "@/features/dashboard/pages/DashboardOverview";
import { ToolPlaceholder } from "@/features/dashboard/pages/ToolPlaceholder";
import { ReportsWorkspace } from "@/features/reports/ReportsWorkspace";
import { SettingsWorkspace } from "@/features/settings/SettingsWorkspace";

export function DashboardContent({
  activeTool,
  onToolChange,
  cProjectState,
  onCProjectStateChange,
  callTreeState,
  onCallTreeStateChange,
  dataDictionaryState,
  onDataDictionaryStateChange,
}: DashboardContentProps) {
  const selectedCscPath = cProjectState.selectedCscPath;

  const openCProjectScanner = () => {
    onToolChange("c-project");
  };

  if (isCustomToolRouteId(activeTool)) {
    return <CustomToolRunnerWorkspace routeId={activeTool} />;
  }

  if (activeTool === "overview") {
    return <DashboardOverview onToolChange={onToolChange} />;
  }

  if (activeTool === "c-project") {
    return (
      <CProjectWorkspace
        state={cProjectState}
        onStateChange={onCProjectStateChange}
      />
    );
  }

  if (activeTool === "call-tree") {
    return (
      <CallTreeWorkspace
        selectedCscPath={selectedCscPath}
        onGoToCProjectScanner={openCProjectScanner}
        state={callTreeState}
        onStateChange={onCallTreeStateChange}
      />
    );
  }

  if (activeTool === "data-dictionary") {
    return (
      <DataDictionaryWorkspace
        selectedCscPath={selectedCscPath}
        onGoToCProjectScanner={openCProjectScanner}
        state={dataDictionaryState}
        onStateChange={onDataDictionaryStateChange}
      />
    );
  }

  if (activeTool === "reports") {
    return (
      <ReportsWorkspace
        selectedCscPath={selectedCscPath}
        callTreeState={callTreeState}
        dataDictionaryState={dataDictionaryState}
        onToolChange={onToolChange}
      />
    );
  }

  if (activeTool === "settings") {
    return (
      <SettingsWorkspace
        selectedCscPath={selectedCscPath}
        onToolChange={onToolChange}
      />
    );
  }

  if (activeTool === "crc-calculator") {
    return <CrcCalculatorWorkspace />;
  }

  if (activeTool === "custom-tool-builder") {
    return <CustomToolBuilderWorkspace />;
  }

  const tool = getToolById(activeTool);

  return (
    <ToolPlaceholder
      title={tool?.title ?? "Tool"}
      description={tool?.description ?? "This workspace is coming soon."}
    />
  );
}