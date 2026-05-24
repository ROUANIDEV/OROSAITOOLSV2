import { useEffect, useState } from "react";

import { getToolTitle } from "@/features/dashboard/dashboardToolSelectors";
import type { ToolId } from "@/features/dashboard/tool-config";

import {
  loadActiveTool,
  saveActiveTool,
} from "@/app/navigation/activeToolStorage";

export function useActiveTool() {
  const [activeTool, setActiveTool] = useState<ToolId>(() =>
    loadActiveTool(),
  );

  useEffect(() => {
    document.title = `OROSAITOOLS · ${getToolTitle(activeTool)}`;
  }, [activeTool]);

  useEffect(() => {
    saveActiveTool(activeTool);
  }, [activeTool]);

  return {
    activeTool,
    setActiveTool,
  };
}