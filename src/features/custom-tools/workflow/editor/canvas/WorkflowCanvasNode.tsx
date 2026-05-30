import {
  GripVertical,
  Maximize2,
  Settings2,
  Trash2,
} from "lucide-react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
  type CustomToolInput,
} from "@/features/custom-tools/domain/customToolTypes";
import { clampNumber, type WorkflowBlockLayout } from "../../graph";
import type { WorkflowConnection } from "../../graph/workflowConnections";
import {
  getBlockInputDetails,
  getBlockOutputPreview,
  getBlockPorts,
} from "../../model";
import type {
  WorkflowInputPort,
  WorkflowOutputPort,
  WorkflowPortConnectionPulse,
  WorkflowPortTarget,
} from "../../model/workflowBlockPorts";
import { FoundationWorkflowCanvasNode } from "./FoundationWorkflowCanvasNode";

type WorkflowCanvasNodeProps = {
  block: CustomToolBlock;
  index: number;
  inputs: CustomToolInput[];
  layout: WorkflowBlockLayout;
  selected: boolean;
  suppressDetails: boolean;
  activeInputTarget: WorkflowPortTarget | null;
  connections: WorkflowConnection[];
  recentConnection: WorkflowPortConnectionPulse | null;
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

function getInputSideTransform(side: WorkflowInputPort["side"]) {
  if (side === "bottom") return "-translate-x-1/2 translate-y-1/2";
  return "-translate-x-1/2 -translate-y-1/2";
}

function getInputTooltipPosition(side: WorkflowInputPort["side"]) {
  if (side === "top") return "left-1/2 top-full mt-2 -translate-x-1/2";
  if (side === "bottom") return "bottom-full left-1/2 mb-2 -translate-x-1/2";
  return "left-full top-1/2 ml-2 -translate-y-1/2";
}

function getRuntimeToneClassName(type: string) {
  if (type.startsWith("file.")) {
    return {
      shell: "border-blue-500/35 bg-card/95 shadow-blue-500/5",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      port: "border-blue-500 text-blue-600 dark:text-blue-300",
      connector: "border-blue-500 text-blue-600 dark:text-blue-300",
    };
  }

  if (type.startsWith("python.")) {
    return {
      shell: "border-yellow-500/35 bg-card/95 shadow-yellow-500/5",
      badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
      port: "border-yellow-500 text-yellow-600 dark:text-yellow-300",
      connector: "border-yellow-500 text-yellow-600 dark:text-yellow-300",
    };
  }

  if (type.startsWith("safety.")) {
    return {
      shell: "border-rose-500/35 bg-card/95 shadow-rose-500/5",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
      port: "border-rose-500 text-rose-600 dark:text-rose-300",
      connector: "border-rose-500 text-rose-600 dark:text-rose-300",
    };
  }

  return {
    shell: "border-border bg-card/95",
    badge: "bg-muted text-muted-foreground",
    port: "border-primary text-primary",
    connector: "border-primary text-primary",
  };
}

function PortTooltip({
  label,
  id,
  dataType,
  description,
  tone,
  className,
}: {
  label: string;
  id: string;
  dataType?: string;
  description?: string;
  tone: "input" | "output";
  className: string;
}) {
  return (
    <span
      className={[
        "pointer-events-none absolute z-50 hidden w-56 rounded-xl border bg-popover p-3 text-left text-[11px] font-normal text-popover-foreground shadow-2xl group-hover/port:block",
        className,
      ].join(" ")}
    >
      <span className="block text-xs font-semibold">{label}</span>
      <span className="mt-1 block text-muted-foreground">
        {description ??
          (tone === "input"
            ? "Drop exactly on this circle to feed this input."
            : "Drag from this circle to feed one input.")}
      </span>
      <span className="mt-2 flex flex-wrap gap-1 text-[10px]">
        <span
          className={[
            "rounded-md px-2 py-1 font-semibold",
            tone === "input"
              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          ].join(" ")}
        >
          {tone}
        </span>
        <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
          {dataType || "any"}
        </span>
      </span>
      <span className="mt-2 block truncate rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
        {id}
      </span>
    </span>
  );
}

function RuntimeWorkflowCanvasNode({
  block,
  index,
  inputs,
  layout,
  selected,
  suppressDetails,
  activeInputTarget,
  connections,
  recentConnection,
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
  const tone = getRuntimeToneClassName(block.type);
  const leftPorts = ports.inputs.filter((port) => port.side === "left");
  const topPorts = ports.inputs.filter((port) => port.side === "top");
  const bottomPorts = ports.inputs.filter((port) => port.side === "bottom");

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

  const isInputPortConnected = (portId: string) =>
    connections.some(
      (connection) =>
        connection.toBlockId === block.id &&
        (connection.toPortId ?? "input") === portId,
    );

  const isOutputPortConnected = (portId: string) =>
    connections.some(
      (connection) =>
        connection.fromBlockId === block.id &&
        (connection.fromPortId ?? "output") === portId,
    );

  const isInputPortPulsing = (portId: string) =>
    recentConnection?.toBlockId === block.id && recentConnection.toPortId === portId;

  const isOutputPortPulsing = (portId: string) =>
    recentConnection?.fromBlockId === block.id && recentConnection.fromPortId === portId;

  const renderPortConnectionIndicator = (connected: boolean, pulsing: boolean) => (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full">
      {connected ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {pulsing ? (
        <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-current opacity-50" />
      ) : null}
    </span>
  );

  const renderInputPort = (
    port: WorkflowInputPort,
    positionStyle: CSSProperties,
  ) => {
    const active =
      activeInputTarget?.blockId === block.id && activeInputTarget.portId === port.id;
    const connected = isInputPortConnected(port.id);
    const pulsing = isInputPortPulsing(port.id);

    return (
      <button
        key={port.id}
        type="button"
        data-no-pan="true"
        data-no-node-hover="true"
        data-workflow-input-port="true"
        data-workflow-block-id={block.id}
        data-workflow-port-id={port.id}
        className={[
          "group/port absolute z-30 h-4 w-4 cursor-crosshair rounded-full border-2 bg-background shadow-sm transition hover:scale-125 hover:border-primary hover:bg-primary/10",
          tone.port,
          connected ? "shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]" : "",
          active ? "ring-2 ring-primary ring-offset-2" : "",
          pulsing ? "animate-pulse" : "",
          getInputSideTransform(port.side),
        ].join(" ")}
        style={positionStyle}
        onPointerMove={(event) => {
          event.stopPropagation();
          onHoverChange(null);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onHoverChange(null);
        }}
        aria-label={`Input port ${port.label}`}
      >
        <span className="sr-only">{port.label}</span>
        {renderPortConnectionIndicator(connected, pulsing)}
        <PortTooltip
          label={port.label}
          id={port.id}
          dataType={port.dataType}
          description={port.description}
          tone="input"
          className={getInputTooltipPosition(port.side)}
        />
      </button>
    );
  };

  const renderOutputPort = (port: WorkflowOutputPort, portIndex: number) => {
    const connected = isOutputPortConnected(port.id);
    const pulsing = isOutputPortPulsing(port.id);

    return (
      <button
        key={port.id}
        type="button"
        data-no-pan="true"
        data-no-node-hover="true"
        data-workflow-output-port="true"
        data-workflow-block-id={block.id}
        data-workflow-port-id={port.id}
        className={[
          "group/port absolute right-0 z-30 h-4 w-4 -translate-y-1/2 translate-x-1/2 cursor-crosshair rounded-full border-2 bg-background shadow-sm transition hover:scale-125 hover:border-primary hover:bg-primary/10",
          tone.connector,
          connected ? "shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]" : "",
          pulsing ? "animate-pulse" : "",
        ].join(" ")}
        style={{ top: `${getEvenPosition(portIndex, ports.outputs.length)}%` }}
        onPointerMove={(event) => {
          event.stopPropagation();
          onHoverChange(null);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onHoverChange(null);
          onStartConnection(port.id, event);
        }}
        aria-label={`Output port ${port.label}`}
      >
        <span className="sr-only">{port.label}</span>
        {renderPortConnectionIndicator(connected, pulsing)}
        <PortTooltip
          label={port.label}
          id={port.id}
          dataType={port.dataType}
          description={port.description}
          tone="output"
          className="right-full top-1/2 mr-2 -translate-y-1/2"
        />
      </button>
    );
  };

  return (
    <div
      className={[
        "absolute select-none rounded-2xl border p-3 text-card-foreground shadow-xl transition",
        tone.shell,
        selected ? "ring-2 ring-primary ring-offset-2" : "",
      ].join(" ")}
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerLeave={() => onHoverChange(null)}
      onPointerMove={handleNodePointerMove}
      onDoubleClick={onEdit}
    >
      {leftPorts.map((port, portIndex) =>
        renderInputPort(port, {
          left: 0,
          top: `${getEvenPosition(portIndex, leftPorts.length)}%`,
        }),
      )}
      {topPorts.map((port, portIndex) =>
        renderInputPort(port, {
          top: 0,
          left: `${getEvenPosition(portIndex, topPorts.length)}%`,
        }),
      )}
      {bottomPorts.map((port, portIndex) =>
        renderInputPort(port, {
          bottom: 0,
          left: `${getEvenPosition(portIndex, bottomPorts.length)}%`,
        }),
      )}

      <div className="flex items-start gap-3">
        <button
          type="button"
          data-no-pan="true"
          data-no-node-hover="true"
          className="mt-0.5 rounded-lg border bg-background/70 p-1 text-muted-foreground hover:text-foreground"
          onPointerDown={(event) => {
            event.stopPropagation();
            onHoverChange(null);
            onStartDrag(event);
          }}
          aria-label="Move block"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{block.label}</h3>
          <p className="text-xs text-muted-foreground">#{index + 1} · {block.type}</p>
        </div>

        <div className="flex shrink-0 gap-1" data-no-node-hover="true">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              hideDetails(event);
              onEdit();
            }}
            aria-label="Edit block"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              hideDetails(event);
              onDelete();
            }}
            aria-label="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", tone.badge].join(" ")}>runtime</span>
      </div>

      <p className="mt-3 rounded-xl bg-background/55 px-3 py-2 text-xs text-muted-foreground">
        {block.description || inputDetails[0] || outputPreview || "No description yet."}
      </p>

      {ports.outputs.map((port, portIndex) => renderOutputPort(port, portIndex))}

      <button
        type="button"
        data-no-pan="true"
        data-no-node-hover="true"
        className="absolute bottom-1 right-1 rounded-lg border bg-background/70 p-1 text-muted-foreground hover:text-foreground"
        onPointerDown={startResize}
        aria-label="Resize block"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function WorkflowCanvasNode(props: WorkflowCanvasNodeProps) {
  if (isFoundationCustomToolBlockType(props.block.type)) {
    return <FoundationWorkflowCanvasNode {...props} />;
  }

  return <RuntimeWorkflowCanvasNode {...props} />;
}
