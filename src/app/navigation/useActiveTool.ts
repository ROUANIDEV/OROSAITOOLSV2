import { useEffect, useState } from "react";

import {
  loadActiveTool,
  saveActiveTool,
} from "@/app/navigation/activeToolStorage";
import { getToolTitle, ToolId } from "@/features/dashboard";

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