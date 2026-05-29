import type { ReactNode } from "react";

import { DashboardOverview } from "@/features/dashboard/pages/DashboardOverview";
import { ToolPlaceholder } from "@/features/dashboard/pages/ToolPlaceholder";

import { CustomToolBuilderWorkspace } from "@/features/custom-tools/builder";
import { isCustomToolRouteId } from "@/features/custom-tools/registry/publishing";
import { CustomToolRunnerWorkspace } from "@/features/custom-tools/runtime/runner";
import { DashboardContentProps, getToolById } from "../../model";
import { ToolId } from "../../config";
import { CProjectWorkspace } from "@/features/c-project";
import { CallTreeWorkspace } from "@/features/call-tree";
import { DataDictionaryWorkspace } from "@/features/data-dictionary";
import { ReportsWorkspace } from "@/features/reports";
import { SettingsWorkspace } from "@/features/settings";
import { CrcCalculatorWorkspace } from "@/features/crc";

type WorkspaceRenderContext = DashboardContentProps & {
  selectedCscPath: DashboardContentProps["cProjectState"]["selectedCscPath"];
  openCProjectScanner: () => void;
};

type WorkspaceRenderer = (context: WorkspaceRenderContext) => ReactNode;

const activeWorkspaceRenderers: Partial<Record<ToolId, WorkspaceRenderer>> = {
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
};

export function DashboardContent(props: DashboardContentProps) {
  const { activeTool, onToolChange, cProjectState } = props;

  if (isCustomToolRouteId(activeTool)) {
    return <CustomToolRunnerWorkspace routeId={activeTool} />;
  }

  const selectedCscPath = cProjectState.selectedCscPath;

  const openCProjectScanner = () => {
    onToolChange("c-project");
  };

  const renderWorkspace = activeWorkspaceRenderers[activeTool];

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