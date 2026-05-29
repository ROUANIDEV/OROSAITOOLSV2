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
import { DashboardSidebarToolItem } from "./DashboardSidebarToolItem";
import { usePublishedCustomToolRoutes } from "../../../custom-tools/registry/publishing/index";
import { getMainTools, getSettingsTool, ToolNavigationProps } from "../../model";

function SidebarBrand({
  onToolChange,
}: Pick<ToolNavigationProps, "onToolChange">) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="OROSAITOOLS"
          size="lg"
          onClick={() => onToolChange("overview")}
          className="rounded-xl"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </div>

          <div className="grid text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">OROSAITOOLS</span>
            <span className="text-xs text-muted-foreground">
              C tooling desktop app
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function DashboardSidebar({
  activeTool,
  onToolChange,
}: ToolNavigationProps) {
  const mainTools = getMainTools();
  const settingsTool = getSettingsTool();
  const customTools = usePublishedCustomToolRoutes();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand onToolChange={onToolChange} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainTools.map((tool) => (
                <DashboardSidebarToolItem
                  key={tool.id}
                  tool={tool}
                  activeTool={activeTool}
                  onToolChange={onToolChange}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {customTools.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Custom tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customTools.map((tool) => (
                  <DashboardSidebarToolItem
                    key={tool.id}
                    tool={tool}
                    activeTool={activeTool}
                    onToolChange={onToolChange}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {settingsTool ? (
            <DashboardSidebarToolItem
              tool={settingsTool}
              activeTool={activeTool}
              onToolChange={onToolChange}
            />
          ) : null}
        </SidebarMenu>

        <Badge
          variant="outline"
          className="w-fit group-data-[collapsible=icon]:hidden"
        >
          Local Tauri app
        </Badge>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}