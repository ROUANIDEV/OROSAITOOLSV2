import type { ReactNode } from "react";

import { CallTreeWorkspace } from "@/features/call-tree/CallTreeWorkspace";
import { CProjectWorkspace } from "@/features/c-project/CProjectWorkspace";
import { CrcCalculatorWorkspace } from "@/features/crc/CrcCalculatorWorkspace";
import { DataDictionaryWorkspace } from "@/features/data-dictionary/DataDictionaryWorkspace";
import type { DashboardContentProps } from "@/features/dashboard/dashboardTypes";
import { getToolById } from "@/features/dashboard/dashboardToolSelectors";
import { DashboardOverview } from "@/features/dashboard/pages/DashboardOverview";
import { ToolPlaceholder } from "@/features/dashboard/pages/ToolPlaceholder";
import type { BuiltInToolId } from "@/features/dashboard/tool-config";
import { ReportsWorkspace } from "@/features/reports/ReportsWorkspace";
import { SettingsWorkspace } from "@/features/settings/SettingsWorkspace";
import { isCustomToolRouteId } from "../custom-tools/registry/publishing";
import { CustomToolBuilderWorkspace } from "../custom-tools/builder";
import { CustomToolRunnerWorkspace } from "../custom-tools/runtime/runner";

type WorkspaceRenderContext = DashboardContentProps & {
  selectedCscPath: DashboardContentProps["cProjectState"]["selectedCscPath"];
  openCProjectScanner: () => void;
};

type BuiltInWorkspaceRenderer = (context: WorkspaceRenderContext) => ReactNode;

const builtInWorkspaceRenderers = {
  overview: ({ onToolChange }) => <DashboardOverview onToolChange={onToolChange} />,

  "c-project": ({ cProjectState, onCProjectStateChange }) => (
    <CProjectWorkspace state={cProjectState} onStateChange={onCProjectStateChange} />
  ),

  "call-tree": ({
    selectedCscPath,
    openCProjectScanner,
    callTreeState,
    onCallTreeStateChange,
  }) => (
    <CallTreeWorkspace
      selectedCscPath={selectedCscPath}
      onGoToCProjectScanner={openCProjectScanner}
      state={callTreeState}
      onStateChange={onCallTreeStateChange}
    />
  ),

  "data-dictionary": ({
    selectedCscPath,
    openCProjectScanner,
    dataDictionaryState,
    onDataDictionaryStateChange,
  }) => (
    <DataDictionaryWorkspace
      selectedCscPath={selectedCscPath}
      onGoToCProjectScanner={openCProjectScanner}
      state={dataDictionaryState}
      onStateChange={onDataDictionaryStateChange}
    />
  ),

  reports: ({ selectedCscPath, callTreeState, dataDictionaryState, onToolChange }) => (
    <ReportsWorkspace
      selectedCscPath={selectedCscPath}
      callTreeState={callTreeState}
      dataDictionaryState={dataDictionaryState}
      onToolChange={onToolChange}
    />
  ),

  settings: ({ selectedCscPath, onToolChange }) => (
    <SettingsWorkspace selectedCscPath={selectedCscPath} onToolChange={onToolChange} />
  ),

  "crc-calculator": () => <CrcCalculatorWorkspace />,

  "custom-tool-builder": () => <CustomToolBuilderWorkspace />,
} satisfies Record<BuiltInToolId, BuiltInWorkspaceRenderer>;

export function DashboardContent(props: DashboardContentProps) {
  const { activeTool, onToolChange, cProjectState } = props;

  if (isCustomToolRouteId(activeTool)) {
    return <CustomToolRunnerWorkspace routeId={activeTool} />;
  }

  const selectedCscPath = cProjectState.selectedCscPath;
  const openCProjectScanner = () => {
    onToolChange("c-project");
  };

  const renderWorkspace = builtInWorkspaceRenderers[activeTool];

  if (renderWorkspace) {
    return <>{renderWorkspace({ ...props, selectedCscPath, openCProjectScanner })}</>;
  }

  const tool = getToolById(activeTool);

  return (
    <ToolPlaceholder
      title={tool?.title ?? "Tool"}
      description={tool?.description ?? "This workspace is coming soon."}
    />
  );
}