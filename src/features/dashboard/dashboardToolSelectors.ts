import {
  tools,
  type ToolConfig,
  type ToolId,
} from "@/features/dashboard/tool-config";

export const DEFAULT_TOOL_ID: ToolId = "overview";
export const SETTINGS_TOOL_ID: ToolId = "settings";

export function getToolById(toolId: ToolId): ToolConfig | undefined {
  return tools.find((tool) => tool.id === toolId);
}

export function getRequiredToolById(toolId: ToolId): ToolConfig {
  return getToolById(toolId) ?? tools[0];
}

export function getToolTitle(toolId: ToolId): string {
  return getToolById(toolId)?.title ?? "Dashboard";
}

export function getToolDescription(toolId: ToolId): string {
  return getToolById(toolId)?.description ?? "This workspace is coming soon.";
}

export function getMainTools(): ToolConfig[] {
  return tools.filter((tool) => tool.id !== SETTINGS_TOOL_ID);
}

export function getSettingsTool(): ToolConfig | undefined {
  return getToolById(SETTINGS_TOOL_ID);
}