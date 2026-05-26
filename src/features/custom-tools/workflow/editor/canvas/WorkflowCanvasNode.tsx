import { GripVertical, Link, Maximize2, Settings2, Trash2 } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { CustomToolBlock, CustomToolInput } from "@/features/custom-tools/domain/customToolTypes";
import { clampNumber, WorkflowBlockLayout } from "../../graph";
import { getBlockInputDetails, getBlockOutputPreview, getBlockPorts, WorkflowPortTarget } from "../../model";


type WorkflowCanvasNodeProps = {
  block: CustomToolBlock;
  index: number;
  inputs: CustomToolInput[];
  layout: WorkflowBlockLayout;
  selected: boolean;
  suppressDetails: boolean;
  activeInputTarget: WorkflowPortTarget | null;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartDrag: (event: ReactPointerEvent) => void;
  onStartConnection: (outputPortId: string, event: ReactPointerEvent) => void;
  onLayoutChange: (layout: Partial<WorkflowBlockLayout>) => void;
  onHoverChange: (block: CustomToolBlock | null) => void;
  onHoverMove: (position: { x: number; y: number }) => void;
};

function isNoHoverTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-no-node-hover='true']"))
  );
}

function getEvenPosition(index: number, count: number) {
  if (count <= 1) return 50;
  return ((index + 1) / (count + 1)) * 100;
}

export function WorkflowCanvasNode({
  block,
  index,
  inputs,
  layout,
  selected,
  suppressDetails,
  activeInputTarget,
  onSelect,
  onEdit,
  onDelete,
  onStartDrag,
  onStartConnection,
  onLayoutChange,
  onHoverChange,
  onHoverMove,
}: WorkflowCanvasNodeProps) {
  const inputDetails = getBlockInputDetails(block, inputs);
  const outputPreview = getBlockOutputPreview(block);
  const ports = getBlockPorts(block);

  const hideDetails = (event?: ReactPointerEvent) => {
    event?.stopPropagation();
    onHoverChange(null);
  };

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onHoverChange(null);

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = layout.width;
    const startHeight = layout.height;

    const handleMove = (moveEvent: PointerEvent) => {
      onLayoutChange({
        width: clampNumber(startWidth + moveEvent.clientX - startX, 220, 560),
        height: clampNumber(startHeight + moveEvent.clientY - startY, 118, 360),
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleNodePointerMove = (event: ReactPointerEvent) => {
    if (suppressDetails || isNoHoverTarget(event.target)) {
      onHoverChange(null);
      return;
    }

    onHoverChange(block);
    onHoverMove({ x: event.clientX, y: event.clientY });
  };

  const leftPorts = ports.inputs.filter((port) => port.side === "left");
  const topPorts = ports.inputs.filter((port) => port.side === "top");
  const bottomPorts = ports.inputs.filter((port) => port.side === "bottom");

  const renderInputPort = (
    port: (typeof ports.inputs)[number],
    positionStyle: React.CSSProperties,
  ) => {
    const active =
      activeInputTarget?.blockId === block.id &&
      activeInputTarget.portId === port.id;

    return (
      <span
        key={port.id}
        className={`absolute z-95 h-3.5 w-3.5 rounded-full border shadow-sm transition ${
          active
            ? "scale-150 border-primary bg-primary shadow-[0_0_22px_hsl(var(--primary)/0.8)]"
            : "border-primary/70 bg-background"
        }`}
        data-no-node-hover="true"
        data-no-pan="true"
        style={positionStyle}
        title={`Input: ${port.label}`}
        onPointerEnter={hideDetails}
        onPointerMove={hideDetails}
      />
    );
  };

  return (
    <div
      className={`absolute overflow-visible rounded-2xl border bg-background/95 p-3 pb-7 shadow-lg backdrop-blur transition ${
        selected ? "z-50 border-primary ring-2 ring-primary/20" : "z-30 hover:z-50"
      }`}
      data-no-pan="true"
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
      }}
      onPointerDown={onSelect}
      onPointerLeave={() => onHoverChange(null)}
      onPointerMove={handleNodePointerMove}
      onDoubleClick={onEdit}
    >
      {leftPorts.map((port, portIndex) =>
        renderInputPort(port, {
          left: "-0.4375rem",
          top: `${getEvenPosition(portIndex, leftPorts.length)}%`,
          transform: "translateY(-50%)",
        }),
      )}

      {topPorts.map((port, portIndex) =>
        renderInputPort(port, {
          top: "-0.4375rem",
          left: `${getEvenPosition(portIndex, topPorts.length)}%`,
          transform: "translateX(-50%)",
        }),
      )}

      {bottomPorts.map((port, portIndex) =>
        renderInputPort(port, {
          bottom: "-0.4375rem",
          left: `${getEvenPosition(portIndex, bottomPorts.length)}%`,
          transform: "translateX(-50%)",
        }),
      )}

      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-2 flex items-start justify-between gap-2">
          <button
            type="button"
            className="rounded-lg border bg-muted p-1.5 text-muted-foreground transition hover:text-foreground"
            data-no-node-hover="true"
            data-no-pan="true"
            onPointerEnter={hideDetails}
            onPointerOver={hideDetails}
            onPointerMove={hideDetails}
            onMouseEnter={() => onHoverChange(null)}
            onPointerDown={(event) => {
              event.stopPropagation();
              onHoverChange(null);
              onStartDrag(event);
            }}
            aria-label="Move block"
          >
            <GripVertical className="h-4 w-4 pointer-events-none" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{block.label}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              #{index + 1} · {block.type}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            data-no-node-hover="true"
            data-no-pan="true"
            onPointerEnter={hideDetails}
            onPointerOver={hideDetails}
            onPointerMove={hideDetails}
            onMouseEnter={() => onHoverChange(null)}
            onClick={onEdit}
          >
            <Settings2 className="h-4 w-4 pointer-events-none" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive"
            data-no-node-hover="true"
            data-no-pan="true"
            onPointerEnter={hideDetails}
            onPointerOver={hideDetails}
            onPointerMove={hideDetails}
            onMouseEnter={() => onHoverChange(null)}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 pointer-events-none" />
          </Button>
        </div>

        <p className="min-h-0 flex-1 overflow-hidden text-xs leading-relaxed text-muted-foreground">
          {block.description || "No description yet."}
        </p>

        <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
          <span className="truncate rounded-full bg-muted px-2 py-1">
            {inputDetails[0] ?? "No input preview"}
          </span>
          <span className="truncate rounded-full bg-muted px-2 py-1">
            {outputPreview}
          </span>
        </div>
      </div>

      {ports.outputs.map((port, portIndex) => (
        <button
          key={port.id}
          type="button"
          className="absolute -right-3 z-95 rounded-full border bg-primary p-1.5 text-primary-foreground shadow-md transition hover:scale-105"
          data-no-node-hover="true"
          data-no-pan="true"
          style={{
            top: `${getEvenPosition(portIndex, ports.outputs.length)}%`,
            transform: "translateY(-50%)",
          }}
          onPointerEnter={hideDetails}
          onPointerOver={hideDetails}
          onPointerMove={hideDetails}
          onMouseEnter={() => onHoverChange(null)}
          onPointerDown={(event) => {
            event.stopPropagation();
            onHoverChange(null);
            onStartConnection(port.id, event);
          }}
          aria-label={`Draw connection from ${port.label}`}
          title={`Output: ${port.label}`}
        >
          <Link className="h-3.5 w-3.5 pointer-events-none" />
        </button>
      ))}

      <button
        type="button"
        className="absolute -bottom-2 -right-2 z-90 rounded-lg border bg-background p-1.5 text-muted-foreground shadow-md transition hover:text-foreground"
        data-no-node-hover="true"
        data-no-pan="true"
        onPointerEnter={hideDetails}
        onPointerOver={hideDetails}
        onPointerMove={hideDetails}
        onMouseEnter={() => onHoverChange(null)}
        onPointerDown={startResize}
        aria-label="Resize block"
      >
        <Maximize2 className="h-3.5 w-3.5 pointer-events-none" />
      </button>
    </div>
  );
}
