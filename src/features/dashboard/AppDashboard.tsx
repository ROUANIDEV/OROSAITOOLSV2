import type { CSSProperties, Dispatch, SetStateAction } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";
import type { DataDictionaryWorkspaceState } from "@/features/data-dictionary/data-dictionary-state";
import { DashboardContent } from "@/features/dashboard/DashboardContent";
import { DashboardSidebar } from "@/features/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/features/dashboard/DashboardTopbar";
import type { ToolId } from "@/features/dashboard/tool-config";

type AppDashboardProps = {
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

export function AppDashboard({
  activeTool,
  onToolChange,
  cProjectState,
  onCProjectStateChange,
  callTreeState,
  onCallTreeStateChange,
  dataDictionaryState,
  onDataDictionaryStateChange,
}: AppDashboardProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3.75rem",
        } as CSSProperties
      }
    >
      <div className="flex min-h-screen w-full bg-muted/30">
        <DashboardSidebar
          activeTool={activeTool}
          onToolChange={onToolChange}
        />

        <SidebarInset className="min-w-0">
          <DashboardTopbar activeTool={activeTool} />

          <DashboardContent
            activeTool={activeTool}
            onToolChange={onToolChange}
            cProjectState={cProjectState}
            onCProjectStateChange={onCProjectStateChange}
            callTreeState={callTreeState}
            onCallTreeStateChange={onCallTreeStateChange}
            dataDictionaryState={dataDictionaryState}
            onDataDictionaryStateChange={onDataDictionaryStateChange}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}