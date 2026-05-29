import {
  GripVertical,
  Link,
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
  validateFoundationBlock,
} from "../../foundation";
import { clampNumber, type WorkflowBlockLayout } from "../../graph";
import {
  getBlockInputDetails,
  getBlockOutputPreview,
  getBlockPorts,
  type WorkflowPortTarget,
} from "../../model";

export type FoundationWorkflowCanvasNodeProps = {
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

function getShapeClassName(shape: ReturnType<typeof getFoundationCanvasNodePresentation>["shape"]) {
  switch (shape) {
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

function formatHiddenDetail(details: string[]) {
  return details.filter(Boolean).slice(0, 2).join(" · ");
}

export function FoundationWorkflowCanvasNode({
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
}: FoundationWorkflowCanvasNodeProps) {
  const inputDetails = getBlockInputDetails(block, inputs);
  const outputPreview = getBlockOutputPreview(block);
  const ports = getBlockPorts(block);
  const presentation = getFoundationCanvasNodePresentation(block);
  const validation = validateFoundationBlock(block);
  const diagnosticCount = validation.diagnostics.length;
  const errorCount = validation.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  ).length;
  const warningCount = validation.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "warning",
  ).length;

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
    positionStyle: CSSProperties,
  ) => {
    const active =
      activeInputTarget?.blockId === block.id &&
      activeInputTarget.portId === port.id;

    return (
      <div
        key={port.id}
        className={[
          "absolute z-20 flex size-3.5 items-center justify-center rounded-full border-2 shadow-sm transition",
          presentation.portClassName,
          active ? "scale-150 ring-4 ring-primary/20" : "",
        ].join(" ")}
        style={positionStyle}
        title={`Input: ${port.label}`}
        data-no-node-hover="true"
      >
        <span className="size-1.5 rounded-full bg-current opacity-70" />
      </div>
    );
  };

  return (
    <div
      className="absolute"
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
      }}
    >
      <article
        className={[
          "relative h-full w-full overflow-visible border bg-card/95 shadow-sm transition",
          "hover:-translate-y-0.5 hover:shadow-md",
          presentation.shellClassName,
          getShapeClassName(presentation.shape),
          selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
        ].join(" ")}
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
            left: "-0.5rem",
            top: `${getEvenPosition(portIndex, leftPorts.length)}%`,
            transform: "translateY(-50%)",
          }),
        )}

        {topPorts.map((port, portIndex) =>
          renderInputPort(port, {
            top: "-0.5rem",
            left: `${getEvenPosition(portIndex, topPorts.length)}%`,
            transform: "translateX(-50%)",
          }),
        )}

        {bottomPorts.map((port, portIndex) =>
          renderInputPort(port, {
            bottom: "-0.5rem",
            left: `${getEvenPosition(portIndex, bottomPorts.length)}%`,
            transform: "translateX(-50%)",
          }),
        )}

        <div className="flex h-full flex-col overflow-hidden rounded-[inherit]">
          <header
            className={[
              "flex items-start gap-3 border-b px-3 py-2.5",
              presentation.headerClassName,
            ].join(" ")}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-0.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
              data-no-node-hover="true"
              onPointerEnter={() => onHoverChange(null)}
              onPointerDown={(event) => {
                event.stopPropagation();
                onHoverChange(null);
                onStartDrag(event);
              }}
              aria-label="Move foundation block"
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </Button>

            <div
              className={[
                "flex h-9 min-w-11 shrink-0 items-center justify-center rounded-xl px-2 text-[10px] font-black tracking-tight shadow-sm",
                presentation.iconClassName,
              ].join(" ")}
              aria-hidden="true"
            >
              {presentation.iconLabel}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {presentation.eyebrow}
                  </p>
                  <h3 className="truncate text-base font-bold leading-tight">
                    {presentation.primaryText}
                  </h3>
                </div>

                <div className="flex shrink-0 items-center gap-1" data-no-node-hover="true">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onPointerEnter={() => onHoverChange(null)}
                    onClick={(event) => {
                      hideDetails(event);
                      onEdit();
                    }}
                    aria-label="Edit foundation block"
                  >
                    <Settings2 className="size-4" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onPointerEnter={() => onHoverChange(null)}
                    onClick={(event) => {
                      hideDetails(event);
                      onDelete();
                    }}
                    aria-label="Delete foundation block"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={[
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    presentation.badgeClassName,
                  ].join(" ")}
                >
                  model
                </span>

                {presentation.chips.slice(0, 3).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}

                {diagnosticCount > 0 ? (
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      errorCount > 0
                        ? "bg-destructive/15 text-destructive"
                        : warningCount > 0
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {errorCount > 0
                      ? `${errorCount} error${errorCount === 1 ? "" : "s"}`
                      : warningCount > 0
                        ? `${warningCount} warning${warningCount === 1 ? "" : "s"}`
                        : `${diagnosticCount} note${diagnosticCount === 1 ? "" : "s"}`}
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-2 px-4 py-3">
            <div className="rounded-xl bg-background/70 p-2.5">
              <p className="truncate text-sm font-semibold">
                {presentation.secondaryText}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {presentation.detailText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <div className="rounded-lg border bg-background/50 px-2 py-1.5">
                <p className="font-semibold uppercase tracking-wide">Input</p>
                <p className="mt-0.5 truncate">
                  {formatHiddenDetail(inputDetails) || "No input preview"}
                </p>
              </div>
              <div className="rounded-lg border bg-background/50 px-2 py-1.5">
                <p className="font-semibold uppercase tracking-wide">Output</p>
                <p className="mt-0.5 truncate">{outputPreview}</p>
              </div>
            </div>
          </div>
        </div>

        {ports.outputs.map((port, portIndex) => (
          <button
            key={port.id}
            type="button"
            className={[
              "absolute right-[-0.7rem] z-20 flex size-6 items-center justify-center rounded-full border-2 shadow-sm transition hover:scale-110",
              presentation.connectorClassName,
            ].join(" ")}
            style={{
              top: `${getEvenPosition(portIndex, ports.outputs.length)}%`,
              transform: "translateY(-50%)",
            }}
            data-no-node-hover="true"
            onPointerEnter={() => onHoverChange(null)}
            onPointerDown={(event) => {
              event.stopPropagation();
              onHoverChange(null);
              onStartConnection(port.id, event);
            }}
            aria-label={`Draw connection from ${port.label}`}
            title={`Output: ${port.label}`}
          >
            <Link className="size-3" aria-hidden="true" />
          </button>
        ))}

        <button
          type="button"
          className="absolute bottom-1.5 right-1.5 z-20 flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-50 transition hover:bg-background/80 hover:opacity-100"
          data-no-node-hover="true"
          onPointerEnter={() => onHoverChange(null)}
          onPointerDown={startResize}
          aria-label="Resize foundation block"
        >
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </button>
      </article>
    </div>
  );
}
