import { Link2Off } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CustomToolBlock } from "../../../domain/customToolTypes";

import type {
  WorkflowConnection,
  WorkflowConnectionStyle,
} from "../../graph/workflowConnections";

type WorkflowConnectionToolbarProps = {
  blocks: CustomToolBlock[];
  connection: WorkflowConnection | null;
  position: { x: number; y: number } | null;
  onDelete: () => void;
  onStyleChange: (style: WorkflowConnectionStyle) => void;
  onEndpointChange: (endpoint: "from" | "to", blockId: string) => void;
};

const styleOptions: WorkflowConnectionStyle[] = ["curved", "solid", "dashed"];

export function WorkflowConnectionToolbar({
  blocks,
  connection,
  position,
  onDelete,
  onStyleChange,
  onEndpointChange,
}: WorkflowConnectionToolbarProps) {
  if (!connection || !position) return null;

  return (
    <div
      className="absolute z-140 w-80 rounded-2xl border bg-popover/90 p-3 shadow-2xl backdrop-blur-md"
      data-no-pan="true"
      style={{
        left: position.x,
        top: position.y,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Connection line</p>

          <p className="break-all font-mono text-[10px] text-muted-foreground">
            {connection.fromBlockId} → {connection.toBlockId}
          </p>
        </div>

        <Button type="button" size="icon" variant="ghost" onClick={onDelete}>
          <Link2Off className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="mb-3 space-y-2">
        <label className="block space-y-1 text-xs">
          <span className="font-medium">From block</span>

          <select
            className="w-full rounded-md border bg-background px-2 py-2 text-xs"
            value={connection.fromBlockId}
            onChange={(event) => onEndpointChange("from", event.target.value)}
          >
            {blocks.map((block) => (
              <option
                key={block.id}
                value={block.id}
                disabled={block.id === connection.toBlockId}
              >
                {block.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-xs">
          <span className="font-medium">To block</span>

          <select
            className="w-full rounded-md border bg-background px-2 py-2 text-xs"
            value={connection.toBlockId}
            onChange={(event) => onEndpointChange("to", event.target.value)}
          >
            {blocks.map((block) => (
              <option
                key={block.id}
                value={block.id}
                disabled={block.id === connection.fromBlockId}
              >
                {block.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {styleOptions.map((style) => (
          <Button
            key={style}
            type="button"
            size="sm"
            variant={connection.style === style ? "default" : "outline"}
            onClick={() => onStyleChange(style)}
          >
            {style}
          </Button>
        ))}
      </div>
    </div>
  );
}