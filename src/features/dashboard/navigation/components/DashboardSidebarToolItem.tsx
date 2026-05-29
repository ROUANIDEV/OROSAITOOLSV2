import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ToolConfig, ToolId } from "../../config";

type DashboardSidebarToolItemProps = {
  tool: ToolConfig;
  activeTool: ToolId;
  onToolChange: (toolId: ToolId) => void;
};

export function DashboardSidebarToolItem({
  tool,
  activeTool,
  onToolChange,
}: DashboardSidebarToolItemProps) {
  const Icon = tool.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={tool.title}
        isActive={activeTool === tool.id}
        onClick={() => onToolChange(tool.id)}
        className="rounded-xl"
      >
        <Icon className="size-4" />
        <span>{tool.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}