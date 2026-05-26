import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

import type { ToolConfig } from "@/features/dashboard/tool-config";

import { loadPublishedCustomTools } from "../../persistence/publishedCustomToolsStorage";
import { createCustomToolRouteId } from "./customToolRoute";
import { CUSTOM_TOOLS_REGISTRY_EVENT } from "./customToolsRegistryEvents";

function sortToolsByName(tools: ToolConfig[]) {
  return [...tools].sort((left, right) => left.title.localeCompare(right.title));
}

export function usePublishedCustomToolRoutes() {
  const [customToolRoutes, setCustomToolRoutes] = useState<ToolConfig[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadRoutes() {
      const publishedTools = await loadPublishedCustomTools();

      if (!isMounted) {
        return;
      }

      setCustomToolRoutes(
        sortToolsByName(
          publishedTools.map((tool) => ({
            id: createCustomToolRouteId(tool.id),
            title: tool.name,
            description: tool.description || "Published custom tool.",
            icon: Wrench,
          })),
        ),
      );
    }

    loadRoutes();

    window.addEventListener(CUSTOM_TOOLS_REGISTRY_EVENT, loadRoutes);
    window.addEventListener("focus", loadRoutes);

    return () => {
      isMounted = false;
      window.removeEventListener(CUSTOM_TOOLS_REGISTRY_EVENT, loadRoutes);
      window.removeEventListener("focus", loadRoutes);
    };
  }, []);

  return customToolRoutes;
}