import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LayoutResult, NODE_HEIGHT, NODE_WIDTH, nodeMatchesSearch, TreeInstance } from "../model";

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
              isActive
                ? "url(#call-tree-arrow-active)"
                : "url(#call-tree-arrow)"
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

type CallTreeGraphNodeProps = {
  instance: TreeInstance;
  selectedNodeName: string | null;
  searchNeedle: string;
  onToggleSelectedNode: (nodeName: string) => void;
};

export function CallTreeGraphNode({
  instance,
  selectedNodeName,
  searchNeedle,
  onToggleSelectedNode,
}: CallTreeGraphNodeProps) {
  const isSelected = selectedNodeName === instance.name;
  const isSearchMatch =
    searchNeedle && nodeMatchesSearch(instance.node, searchNeedle);
  const isDimmed = searchNeedle && !isSearchMatch && !isSelected;

  return (
    <foreignObject
      x={instance.x}
      y={instance.y}
      width={NODE_WIDTH}
      height={NODE_HEIGHT}
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onToggleSelectedNode(instance.name)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggleSelectedNode(instance.name);
          }
        }}
        className={cn(
          "flex h-full cursor-pointer flex-col justify-between rounded-2xl border bg-card p-4 text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
          isSelected && "border-primary ring-2 ring-primary/30",
          isSearchMatch && "border-primary",
          instance.repeated && "border-dashed",
          instance.cycle && "border-destructive/70",
          isDimmed && "opacity-35",
        )}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-base font-semibold leading-5">
              {instance.name}
            </p>

            <Badge
              variant={
                instance.cycle
                  ? "destructive"
                  : instance.node.isRoot
                    ? "default"
                    : "secondary"
              }
              className="shrink-0"
            >
              {instance.cycle
                ? "Cycle"
                : instance.node.isRoot
                  ? "Root"
                  : `D${instance.depth}`}
            </Badge>
          </div>

          <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
            {instance.node.file || "No file"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>line {instance.node.line || "—"}</span>
          <span>
            calls {instance.node.outgoingCount} · by{" "}
            {instance.node.incomingCount}
          </span>
          {instance.hiddenChildren > 0 && (
            <span>+{instance.hiddenChildren}</span>
          )}
        </div>
      </div>
    </foreignObject>
  );
}