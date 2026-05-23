import type { Dispatch, SetStateAction } from "react";

import { CallTreeWorkspace } from "@/features/call-tree/CallTreeWorkspace";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import { CProjectWorkspace } from "@/features/c-project/CProjectWorkspace";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";
import { DataDictionaryWorkspace } from "@/features/data-dictionary/DataDictionaryWorkspace";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import { DashboardOverview } from "@/features/dashboard/pages/DashboardOverview";
import { ToolPlaceholder } from "@/features/dashboard/pages/ToolPlaceholder";
import { tools, type ToolId } from "@/features/dashboard/tool-config";

type DashboardContentProps = {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  cProjectState: CProjectWorkspaceState;
  onCProjectStateChange: Dispatch<SetStateAction<CProjectWorkspaceState>>;
  callTreeState: CallTreeWorkspaceState;
  onCallTreeStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>;
  dataDictionaryState: DataDictionaryWorkspaceState;
  onDataDictionaryStateChange: Dispatch<
    SetStateAction<DataDictionaryWorkspaceState>
  >;
};

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
        selectedCscPath={cProjectState.selectedCscPath}
        onGoToCProjectScanner={() => onToolChange("c-project")}
        state={callTreeState}
        onStateChange={onCallTreeStateChange}
      />
    );
  }

  if (activeTool === "data-dictionary") {
    return (
      <DataDictionaryWorkspace
        selectedCscPath={cProjectState.selectedCscPath}
        onGoToCProjectScanner={() => onToolChange("c-project")}
        state={dataDictionaryState}
        onStateChange={onDataDictionaryStateChange}
      />
    );
  }

  const tool = tools.find((item) => item.id === activeTool);

  return (
    <ToolPlaceholder
      title={tool?.title ?? "Tool"}
      description={tool?.description ?? "Tool workspace"}
    />
  );
}