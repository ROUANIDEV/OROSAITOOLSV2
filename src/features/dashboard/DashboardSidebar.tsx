import { Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import type { ToolNavigationProps } from "@/features/dashboard/dashboardTypes";
import {
  getMainTools,
  getSettingsTool,
} from "@/features/dashboard/dashboardToolSelectors";

export function DashboardSidebar({
  activeTool,
  onToolChange,
}: ToolNavigationProps) {
  const mainTools = getMainTools();
  const settingsTool = getSettingsTool();

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="inset"
      className="border-sidebar-border/70"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              isActive={activeTool === "overview"}
              onClick={() => onToolChange("overview")}
              className="rounded-xl"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Wrench className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">OROSAITOOLS</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  C tooling desktop app
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    isActive={activeTool === tool.id}
                    tooltip={tool.title}
                    onClick={() => onToolChange(tool.id)}
                    className="h-9 rounded-xl"
                  >
                    <tool.icon />
                    <span>{tool.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {settingsTool && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTool === settingsTool.id}
                tooltip={settingsTool.title}
                onClick={() => onToolChange(settingsTool.id)}
                className="h-9 rounded-xl"
              >
                <settingsTool.icon />
                <span>{settingsTool.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <Badge variant="secondary" className="mx-2 justify-center rounded-lg">
            Local Tauri app
          </Badge>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}