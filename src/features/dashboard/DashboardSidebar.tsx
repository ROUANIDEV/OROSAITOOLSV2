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
import { tools, type ToolId } from "@/features/dashboard/tool-config";

type DashboardSidebarProps = {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
};

export function DashboardSidebar({
  activeTool,
  onToolChange,
}: DashboardSidebarProps) {
  const mainTools = tools.filter((tool) => tool.id !== "settings");
  const settingsTool = tools.find((tool) => tool.id === "settings");

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="OROSAITOOLS"
              className="h-12 gap-3"
            >
              <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Wrench className="size-4" />
              </div>

              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">OROSAITOOLS</span>
                <span className="truncate text-xs text-muted-foreground">
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
                    tooltip={tool.title}
                    isActive={activeTool === tool.id}
                    onClick={() => onToolChange(tool.id)}
                    className="h-10 justify-start gap-3 px-3"
                  >
                    <tool.icon className="size-4 shrink-0" />
                    <span className="truncate">{tool.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {settingsTool && (
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={settingsTool.title}
                    isActive={activeTool === settingsTool.id}
                    onClick={() => onToolChange(settingsTool.id)}
                    className="h-10 justify-start gap-3 px-3"
                  >
                    <settingsTool.icon className="size-4 shrink-0" />
                    <span className="truncate">{settingsTool.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="px-2 py-2">
          <Badge variant="secondary" className="w-full justify-center">
            Local Tauri app
          </Badge>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}