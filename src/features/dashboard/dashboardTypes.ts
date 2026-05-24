import type { Dispatch, SetStateAction } from "react";

import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import type { ToolId } from "@/features/dashboard/tool-config";

export type ToolChangeHandler = (tool: ToolId) => void;

export type ActiveToolProps = {
  activeTool: ToolId;
};

export type ToolNavigationProps = ActiveToolProps & {
  onToolChange: ToolChangeHandler;
};

export type DashboardWorkspaceStateProps = {
  cProjectState: CProjectWorkspaceState;
  onCProjectStateChange: Dispatch<SetStateAction<CProjectWorkspaceState>>;

  callTreeState: CallTreeWorkspaceState;
  onCallTreeStateChange: Dispatch<SetStateAction<CallTreeWorkspaceState>>;

  dataDictionaryState: DataDictionaryWorkspaceState;
  onDataDictionaryStateChange: Dispatch<
    SetStateAction<DataDictionaryWorkspaceState>
  >;
};

export type DashboardContentProps = ToolNavigationProps &
  DashboardWorkspaceStateProps;

export type AppDashboardProps = DashboardContentProps;