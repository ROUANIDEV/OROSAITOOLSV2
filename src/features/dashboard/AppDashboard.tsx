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
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as CSSProperties
      }
      className="min-h-screen bg-muted/40"
    >
      <DashboardSidebar activeTool={activeTool} onToolChange={onToolChange} />

      <SidebarInset className="m-2 min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm md:m-3">
        <DashboardTopbar activeTool={activeTool} />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
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
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}