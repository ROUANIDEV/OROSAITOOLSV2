import { Badge } from "@/components/ui/badge";
import {
  NODE_HEIGHT,
  NODE_WIDTH,
} from "@/features/call-tree/graph/callTreeGraphConstants";
import { nodeMatchesSearch } from "@/features/call-tree/graph/callTreeGraphData";
import type { TreeInstance } from "@/features/call-tree/graph/callTreeGraphTypes";
import { cn } from "@/lib/utils";

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