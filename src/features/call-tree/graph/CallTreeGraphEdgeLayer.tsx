import {
  NODE_HEIGHT,
  NODE_WIDTH,
} from "@/features/call-tree/graph/callTreeGraphConstants";
import { nodeMatchesSearch } from "@/features/call-tree/graph/callTreeGraphData";
import type {
  LayoutResult,
  TreeInstance,
} from "@/features/call-tree/graph/callTreeGraphTypes";
import { cn } from "@/lib/utils";

type CallTreeGraphEdgeLayerProps = {
  layout: LayoutResult;
  instanceById: Map<string, TreeInstance>;
  selectedNodeName: string | null;
  searchNeedle: string;
};

export function CallTreeGraphEdgeLayer({
  layout,
  instanceById,
  selectedNodeName,
  searchNeedle,
}: CallTreeGraphEdgeLayerProps) {
  return (
    <>
      {layout.edges.map((edgeInstance) => {
        const from = instanceById.get(edgeInstance.fromInstanceId);
        const to = instanceById.get(edgeInstance.toInstanceId);

        if (!from || !to) {
          return null;
        }

        const isActive =
          selectedNodeName === from.name || selectedNodeName === to.name;
        const isDimmed =
          searchNeedle &&
          !nodeMatchesSearch(from.node, searchNeedle) &&
          !nodeMatchesSearch(to.node, searchNeedle);
        const startX = from.x + NODE_WIDTH;
        const startY = from.y + NODE_HEIGHT / 2;
        const endX = to.x;
        const endY = to.y + NODE_HEIGHT / 2;
        const curve = Math.max(110, (endX - startX) * 0.55);
        const d = [
          `M ${startX} ${startY}`,
          `C ${startX + curve} ${startY}`,
          `${endX - curve} ${endY}`,
          `${endX} ${endY}`,
        ].join(" ");

        return (
          <path
            key={edgeInstance.id}
            d={d}
            fill="none"
            strokeWidth={isActive ? 4 : 2.4}
            markerEnd={
              isActive ? "url(#call-tree-arrow-active)" : "url(#call-tree-arrow)"
            }
            className={cn(
              "transition-all",
              isActive
                ? "stroke-primary opacity-100"
                : "stroke-muted-foreground/35",
              isDimmed && "opacity-15",
            )}
          />
        );
      })}
    </>
  );
}