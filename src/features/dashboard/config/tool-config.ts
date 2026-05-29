import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Calculator,
  FileCode2,
  GitBranch,
  Home,
  Settings2,
  Table2,
  Workflow,
} from "lucide-react";

export type BuiltInToolId =
  | "overview"
  | "c-project"
  | "call-tree"
  | "data-dictionary"
  | "crc-calculator"
  | "reports"
  | "custom-tool-builder"
  | "settings";

export type CustomToolRouteId = `custom:${string}`;

export type ToolId = BuiltInToolId | CustomToolRouteId;

export type ToolConfig = {
  id: ToolId;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const tools: ToolConfig[] = [
  {
    id: "overview",
    title: "Dashboard",
    description: "Project overview and quick actions.",
    icon: Home,
  },
  {
    id: "c-project",
    title: "C Project Scanner",
    description: "Select project root and detect CSC folders.",
    icon: FileCode2,
  },
  {
    id: "call-tree",
    title: "Call Tree",
    description: "Generate call_tree.xlsx from the selected CSC.",
    icon: GitBranch,
  },
  {
    id: "data-dictionary",
    title: "Data Dictionary",
    description: "Generate data_dictionnary.xlsx from the selected CSC.",
    icon: BookOpen,
  },
  {
    id: "crc-calculator",
    title: "CRC Calculator",
    description: "Calculate CRC values for any protocol.",
    icon: Calculator,
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review generated Excel outputs.",
    icon: Table2,
  },
  {
    id: "custom-tool-builder",
    title: "Custom Tool Builder",
    description: "Design reusable tools with blocks, test runs, and publishing.",
    icon: Workflow,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Application preferences.",
    icon: Settings2,
  },
];

export const dashboardStats = [
  {
    title: "Tool workspaces",
    value: "7",
    description: "Scanner, analyzers, CRC, reports, custom builder, and settings.",
    icon: BarChart3,
  },
  {
    title: "UI system",
    value: "shadcn",
    description: "Tailwind CSS + shadcn/ui.",
    icon: Boxes,
  },
  {
    title: "Exports",
    value: "xlsx",
    description: "Call Tree and Data Dictionary ready.",
    icon: Table2,
  },
];

export function isToolId(value: unknown): value is ToolId {
  return (
    typeof value === "string" &&
    (tools.some((tool) => tool.id === value) || value.startsWith("custom:"))
  );
}