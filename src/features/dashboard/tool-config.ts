import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpen,
  Boxes,
  FileCode2,
  GitBranch,
  Home,
  Network,
  Settings2,
  Table2,
} from "lucide-react";

export type ToolId =
  | "overview"
  | "c-project"
  | "call-tree"
  | "data-dictionary"
  | "interfaces"
  | "runnables"
  | "reports"
  | "settings";

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
    id: "interfaces",
    title: "Interfaces",
    description: "Extract and review project interfaces.",
    icon: Network,
  },
  {
    id: "runnables",
    title: "Runnables",
    description: "Analyze runnable entities.",
    icon: Boxes,
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review generated Excel outputs.",
    icon: Table2,
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
    description: "Each tool has its own page.",
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