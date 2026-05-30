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
import type {
  CustomToolBlock,
  CustomToolInput,
} from "@/features/custom-tools/domain/customToolTypes";
import {
  getFoundationCanvasNodePresentation,
} from "../../foundation";
import { countActionableDiagnostics } from "../../diagnostics/workflowBlockDiagnostics";
import { clampNumber, type WorkflowBlockLayout } from "../../graph";
import type { WorkflowConnection } from "../../graph/workflowConnections";
import { getBlockPorts } from "../../model";
import type {
  WorkflowInputPort,
  WorkflowOutputPort,
  WorkflowPortConnectionPulse,
  WorkflowPortTarget,
} from "../../model/workflowBlockPorts";

export type FoundationWorkflowCanvasNodeProps = {
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

function getShapeClassName(shape: ReturnType<typeof getFoundationCanvasNodePresentation>["shape"]) {
  switch (shape) {
    case "ioInput":
    case "ioOutput":
      return "rounded-[1.75rem] border-2";
    case "math":
      return "rounded-2xl border-l-8";
    case "logic":
      return "rounded-3xl border-dashed";
    case "variable":
      return "rounded-r-2xl rounded-l-md border-l-8";
    case "constant":
      return "rounded-2xl border-2 border-double";
    case "expression":
      return "rounded-2xl border-l-4";
    case "scope":
      return "rounded-xl border-dotted";
    case "function":
      return "rounded-2xl border-t-8";
    case "call":
      return "rounded-2xl border-b-8";
    case "condition":
      return "rounded-3xl border-dashed";
    case "loop":
      return "rounded-3xl border-dashed border-l-8";
    case "collection":
      return "rounded-xl border-l-8 border-r-4";
    default:
      return "rounded-2xl";
  }
}

function getInputSideTransform(side: WorkflowInputPort["side"]) {
  if (side === "bottom") return "-translate-x-1/2 translate-y-1/2";
  return "-translate-x-1/2 -translate-y-1/2";
}

function getInputTooltipPosition(side: WorkflowInputPort["side"]) {
  if (side === "top") {
    return "left-1/2 top-full mt-2 -translate-x-1/2";
  }
  if (side === "bottom") {
    return "bottom-full left-1/2 mb-2 -translate-x-1/2";
  }
  return "left-full top-1/2 ml-2 -translate-y-1/2";
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
            ? "Accepts one arrow on this exact input port."
            : "Produces one arrow from this exact output port.")}
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

export function FoundationWorkflowCanvasNode({
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
}: FoundationWorkflowCanvasNodeProps) {
  const ports = getBlockPorts(block);
  const presentation = getFoundationCanvasNodePresentation(block);
  const actionableDiagnostics = countActionableDiagnostics(block, connections);
  const diagnosticCount = actionableDiagnostics.total;
  const errorCount = actionableDiagnostics.errors;
  const warningCount = actionableDiagnostics.warnings;

  const topPorts = ports.inputs.filter((port) => port.side === "top");
  const leftPorts = ports.inputs.filter((port) => port.side === "left");
  const bottomPorts = ports.inputs.filter((port) => port.side === "bottom");
  const canvasInputCount = inputs.length;
  const compactNode = layout.width < 285 || layout.height < 190;
  const tinyNode = layout.width < 255 || layout.height < 165;
  const visibleChipCount = tinyNode ? 1 : compactNode ? 2 : 4;

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
        width: clampNumber(startWidth + moveEvent.clientX - startX, 240, 620),
        height: clampNumber(startHeight + moveEvent.clientY - startY, 150, 420),
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
          presentation.portClassName,
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
          presentation.connectorClassName,
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
        "absolute select-none overflow-visible border p-3 text-card-foreground shadow-xl transition",
        presentation.shellClassName,
        getShapeClassName(presentation.shape),
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

      <div className={tinyNode ? "flex items-start gap-2" : "flex items-start gap-3"}>
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

        <div
          className={[
            tinyNode
              ? "hidden"
              : compactNode
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black",
            presentation.iconClassName,
          ].join(" ")}
        >
          {presentation.iconLabel}
        </div>

        <div className="min-w-0 flex-1 space-y-1 pr-16">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>#{index + 1}</span>
            <span>{presentation.eyebrow}</span>
            {canvasInputCount > 0 && block.type !== "io.input" ? (
              <span>{canvasInputCount} canvas input{canvasInputCount === 1 ? "" : "s"}</span>
            ) : null}
          </div>
          <h3 className={compactNode ? "truncate text-sm font-semibold" : "truncate text-base font-semibold"}>
            {presentation.primaryText}
          </h3>
          {!tinyNode ? (
            <p className="truncate text-xs text-muted-foreground">{presentation.secondaryText}</p>
          ) : null}
        </div>

        <div className="absolute right-3 top-3 flex shrink-0 gap-1" data-no-node-hover="true">
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

      <div className={compactNode ? "mt-2 flex max-h-6 flex-wrap gap-1 overflow-hidden" : "mt-3 flex flex-wrap gap-1.5"}>
        {presentation.chips.slice(0, visibleChipCount).map((chip) => (
          <span
            key={chip}
            className={[
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              presentation.badgeClassName,
            ].join(" ")}
          >
            {chip}
          </span>
        ))}
        {diagnosticCount > 0 ? (
          <span
            className={[
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              errorCount > 0
                ? "border-destructive/30 bg-destructive/15 text-destructive"
                : warningCount > 0
                  ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border-muted bg-muted text-muted-foreground",
            ].join(" ")}
          >
            {errorCount > 0
              ? `${errorCount} fix${errorCount === 1 ? "" : "es"}`
              : warningCount > 0
                ? `${warningCount} check${warningCount === 1 ? "" : "s"}`
                : `${diagnosticCount} note${diagnosticCount === 1 ? "" : "s"}`}
          </span>
        ) : null}
      </div>

      {!compactNode ? (
        <p className="mt-3 max-h-16 overflow-hidden rounded-xl bg-background/55 px-3 py-2 text-xs text-muted-foreground">
          {presentation.detailText}
        </p>
      ) : null}

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
