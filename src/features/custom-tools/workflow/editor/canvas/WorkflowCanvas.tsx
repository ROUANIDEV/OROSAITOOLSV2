import {
  Hand,
  LocateFixed,
  MousePointer2,
  Move3D,
  Redo2,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";

import { Button } from "@/components/ui/button";
import type {
  CustomToolBlock,
  CustomToolInput,
} from "../../../domain/customToolTypes";
import type {
  WorkflowPortConnectionPulse,
  WorkflowPortTarget,
} from "../../model/workflowBlockPorts";
import {
  getBlockLayout,
  getDropPreviewLayout,
  WORKFLOW_CANVAS_HEIGHT,
  WORKFLOW_CANVAS_WIDTH,
  type WorkflowBlockLayout,
} from "../../graph/workflowCanvasLayout";
import {
  clampZoom,
  DEFAULT_WORKFLOW_CANVAS_VIEWPORT,
  type WorkflowCanvasViewport,
} from "../../graph/workflowCanvasViewport";
import type {
  WorkflowConnection,
  WorkflowConnectionStyle,
} from "../../graph/workflowConnections";
import type {
  ActiveWorkflowPointerDrag,
  WorkflowCanvasPoint,
} from "../../graph/workflowPointerDragTypes";
import { WorkflowCanvasConnections } from "./WorkflowCanvasConnections";
import { WorkflowCanvasNode } from "./WorkflowCanvasNode";
import { WorkflowConnectionPreviewArrows } from "./WorkflowConnectionPreviewArrows";
import { WorkflowConnectionToolbar } from "./WorkflowConnectionToolbar";
import { WorkflowDragPreviewNode } from "./WorkflowDragPreviewNode";
import { WorkflowNodeDetailsPopover } from "./WorkflowNodeDetailsPopover";

type WorkflowCanvasProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  blocks: CustomToolBlock[];
  inputs: CustomToolInput[];
  connections: WorkflowConnection[];
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  selectedConnectionId: string | null;
  activeDrag: ActiveWorkflowPointerDrag | null;
  activeCanvasPoint: WorkflowCanvasPoint | null;
  isDragging: boolean;
  viewport: WorkflowCanvasViewport;
  canUndo: boolean;
  canRedo: boolean;
  canDeleteSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRequestDeleteSelection: () => void;
  onViewportChange: (viewport: WorkflowCanvasViewport) => void;
  onSelectBlock: (blockId: string) => void;
  onSelectBlocks: (blockIds: string[]) => void;
  onSelectConnection: (connectionId: string | null) => void;
  onAddConnection: (
    fromBlockId: string,
    toBlockId: string,
    fromPortId?: string,
    toPortId?: string,
  ) => void;
  onDeleteConnection: (connectionId: string) => void;
  onConnectionStyleChange: (
    connectionId: string,
    style: WorkflowConnectionStyle,
  ) => void;
  onConnectionEndpointChange: (
    connectionId: string,
    endpoint: "from" | "to",
    blockId: string,
  ) => void;
  onEditBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onStartBlockDrag: (index: number, event: ReactPointerEvent) => void;
  onBlockLayoutChange: (
    blockId: string,
    layout: Partial<WorkflowBlockLayout>,
  ) => void;
};

type DraftConnection = {
  fromBlockId: string;
  fromPortId: string;
  toPoint: WorkflowCanvasPoint;
};

type SelectionBox = {
  start: WorkflowCanvasPoint;
  current: WorkflowCanvasPoint;
};

type GroupDragPreview = {
  block: CustomToolBlock;
  layout: WorkflowBlockLayout;
};

type DragPreviewState = {
  previews: GroupDragPreview[];
  previewLayouts: Map<string, WorkflowBlockLayout>;
  movedBlockIds: Set<string>;
};

function clampToolbarPosition(value: number, max: number) {
  return Math.min(Math.max(value, 16), max);
}

function isNoPanTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-no-pan='true']"))
  );
}

function getEdgePanDelta(distance: number) {
  if (distance < 24) return 24;
  if (distance < 48) return 16;
  if (distance < 82) return 9;
  return 0;
}

function getSelectionRect(selectionBox: SelectionBox) {
  const left = Math.min(selectionBox.start.x, selectionBox.current.x);
  const top = Math.min(selectionBox.start.y, selectionBox.current.y);
  const right = Math.max(selectionBox.start.x, selectionBox.current.x);
  const bottom = Math.max(selectionBox.start.y, selectionBox.current.y);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    right,
    bottom,
  };
}

function blockIntersectsRect(
  layout: WorkflowBlockLayout,
  rect: ReturnType<typeof getSelectionRect>,
) {
  return (
    layout.x <= rect.right &&
    layout.x + layout.width >= rect.left &&
    layout.y <= rect.bottom &&
    layout.y + layout.height >= rect.top
  );
}

function getExactCanvasPortTargetFromElement(
  element: Element | null,
  portKind: "input" | "output",
): WorkflowPortTarget | null {
  const selector =
    portKind === "input"
      ? "[data-workflow-input-port='true']"
      : "[data-workflow-output-port='true']";
  const portElement = element?.closest(selector);
  if (!(portElement instanceof HTMLElement)) return null;

  const blockId = portElement.dataset.workflowBlockId;
  const portId = portElement.dataset.workflowPortId;
  if (!blockId || !portId) return null;

  return { blockId, portId };
}

function GroupDragPreviewNodes({ previews }: { previews: GroupDragPreview[] }) {
  if (previews.length === 0) return null;

  return (
    <>
      {previews.map(({ block, layout }) => (
        <div
          key={block.id}
          className="pointer-events-none absolute rounded-2xl border border-primary/50 bg-primary/10 p-3 text-xs text-primary shadow-xl"
          style={{
            left: layout.x,
            top: layout.y,
            width: layout.width,
            minHeight: layout.height,
          }}
        >
          <p className="font-semibold">{block.label}</p>
          <p className="text-[11px] opacity-80">{block.type}</p>
          <p className="mt-2 text-[11px]">Moving with selected group.</p>
        </div>
      ))}
    </>
  );
}

export function WorkflowCanvas({
  canvasRef,
  blocks,
  inputs,
  connections,
  selectedBlockId,
  selectedBlockIds,
  selectedConnectionId,
  activeDrag,
  activeCanvasPoint,
  isDragging,
  viewport,
  canUndo,
  canRedo,
  canDeleteSelection,
  onUndo,
  onRedo,
  onRequestDeleteSelection,
  onViewportChange,
  onSelectBlock,
  onSelectBlocks,
  onSelectConnection,
  onAddConnection,
  onDeleteConnection,
  onConnectionStyleChange,
  onConnectionEndpointChange,
  onEditBlock,
  onDeleteBlock,
  onStartBlockDrag,
  onBlockLayoutChange,
}: WorkflowCanvasProps) {
  const selectionBoxRef = useRef<SelectionBox | null>(null);
  const [panMode, setPanMode] = useState(true);
  const [hoveredBlock, setHoveredBlock] = useState<CustomToolBlock | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [draftConnection, setDraftConnection] = useState<DraftConnection | null>(null);
  const [activeInputTarget, setActiveInputTarget] = useState<WorkflowPortTarget | null>(null);
  const [recentConnection, setRecentConnection] =
    useState<WorkflowPortConnectionPulse | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const suppressDetails = isDragging || draftConnection !== null || selectionBox !== null;

  const layouts = useMemo(() => {
    return new Map(
      blocks.map((block, index) => {
        return [block.id, getBlockLayout(block, index)] as const;
      }),
    );
  }, [blocks]);

  const selectedConnection =
    connections.find((connection) => connection.id === selectedConnectionId) ?? null;

  const selectedConnectionToolbarPosition = useMemo(() => {
    if (!selectedConnection) return null;
    const from = layouts.get(selectedConnection.fromBlockId);
    const to = layouts.get(selectedConnection.toBlockId);
    if (!from || !to) return null;
    const canvasX = (from.x + from.width + to.x) / 2;
    const canvasY = (from.y + to.y) / 2;
    return {
      x: clampToolbarPosition(canvasX * viewport.zoom + viewport.panX - 160, 900),
      y: clampToolbarPosition(canvasY * viewport.zoom + viewport.panY, 540),
    };
  }, [layouts, selectedConnection, viewport.panX, viewport.panY, viewport.zoom]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.panX) / viewport.zoom,
      y: (clientY - rect.top - viewport.panY) / viewport.zoom,
    };
  };

  const liveDragCanvasPoint =
    activeDrag !== null ? getCanvasPoint(activeDrag.x, activeDrag.y) : null;
  const dropPreview =
    activeDrag && (liveDragCanvasPoint ?? activeCanvasPoint)
      ? getDropPreviewLayout(liveDragCanvasPoint ?? activeCanvasPoint!)
      : null;

  const dragPreviewState = useMemo<DragPreviewState>(() => {
    const emptyState: DragPreviewState = {
      previews: [],
      previewLayouts: new Map(),
      movedBlockIds: new Set(),
    };

    if (!activeDrag || activeDrag.kind !== "existing-block" || !dropPreview) {
      return emptyState;
    }

    const draggedBlock = blocks[activeDrag.blockIndex];
    if (!draggedBlock) return emptyState;
    const draggedLayout = layouts.get(draggedBlock.id);
    if (!draggedLayout) return emptyState;

    const selectedIds =
      selectedBlockIds.includes(draggedBlock.id) && selectedBlockIds.length > 1
        ? new Set(selectedBlockIds)
        : new Set([draggedBlock.id]);
    const deltaX = dropPreview.x - draggedLayout.x;
    const deltaY = dropPreview.y - draggedLayout.y;
    const previewLayouts = new Map<string, WorkflowBlockLayout>();
    const previews = blocks
      .filter((block) => selectedIds.has(block.id))
      .map((block, index) => {
        const layout = layouts.get(block.id) ?? getBlockLayout(block, index);
        const nextLayout = {
          ...layout,
          x: layout.x + deltaX,
          y: layout.y + deltaY,
        };
        previewLayouts.set(block.id, nextLayout);
        return { block, layout: nextLayout };
      });

    return {
      previews,
      previewLayouts,
      movedBlockIds: selectedIds,
    };
  }, [activeDrag, blocks, dropPreview, layouts, selectedBlockIds]);

  const findExactInputPort = (
    clientX: number,
    clientY: number,
    exceptBlockId: string,
  ): WorkflowPortTarget | null => {
    const exact = getExactCanvasPortTargetFromElement(
      document.elementFromPoint(clientX, clientY),
      "input",
    );

    if (!exact || exact.blockId === exceptBlockId) return null;
    return exact;
  };

  const selectBlocksInsideBox = (box: SelectionBox) => {
    const rect = getSelectionRect(box);
    if (rect.width < 6 && rect.height < 6) {
      onSelectBlocks([]);
      return;
    }

    const nextSelectedBlockIds = blocks
      .filter((block) => {
        const layout = layouts.get(block.id);
        return layout ? blockIntersectsRect(layout, rect) : false;
      })
      .map((block) => block.id);

    onSelectBlocks(nextSelectedBlockIds);
  };

  const nudgeViewportForScreenPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const leftDelta = getEdgePanDelta(clientX - rect.left);
    const rightDelta = getEdgePanDelta(rect.right - clientX);
    const topDelta = getEdgePanDelta(clientY - rect.top);
    const bottomDelta = getEdgePanDelta(rect.bottom - clientY);
    if (!leftDelta && !rightDelta && !topDelta && !bottomDelta) return;

    onViewportChange({
      ...viewport,
      panX: viewport.panX + leftDelta - rightDelta,
      panY: viewport.panY + topDelta - bottomDelta,
    });
  };

  useEffect(() => {
    if (!activeDrag) return;
    nudgeViewportForScreenPoint(activeDrag.x, activeDrag.y);
  }, [activeDrag?.x, activeDrag?.y]);

  const startPanOrSelection = (event: ReactPointerEvent) => {
    if (isDragging || draftConnection || isNoPanTarget(event.target)) {
      return;
    }

    if (!panMode) {
      const startPoint = getCanvasPoint(event.clientX, event.clientY);
      if (!startPoint) return;
      event.preventDefault();
      setHoveredBlock(null);
      onSelectConnection(null);
      const initialBox = { start: startPoint, current: startPoint };
      selectionBoxRef.current = initialBox;
      setSelectionBox(initialBox);

      const handleMove = (moveEvent: PointerEvent) => {
        const currentPoint = getCanvasPoint(moveEvent.clientX, moveEvent.clientY);
        if (!currentPoint || !selectionBoxRef.current) return;
        const nextBox = { ...selectionBoxRef.current, current: currentPoint };
        selectionBoxRef.current = nextBox;
        setSelectionBox(nextBox);
      };

      const handleUp = () => {
        const completedBox = selectionBoxRef.current;
        if (completedBox) {
          selectBlocksInsideBox(completedBox);
        }
        selectionBoxRef.current = null;
        setSelectionBox(null);
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      return;
    }

    event.preventDefault();
    setHoveredBlock(null);
    const startX = event.clientX;
    const startY = event.clientY;
    const startPanX = viewport.panX;
    const startPanY = viewport.panY;

    const handleMove = (moveEvent: PointerEvent) => {
      onViewportChange({
        ...viewport,
        panX: startPanX + moveEvent.clientX - startX,
        panY: startPanY + moveEvent.clientY - startY,
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const startConnectionDrag = (
    fromBlockId: string,
    fromPortId: string,
    event: ReactPointerEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const startPoint = getCanvasPoint(event.clientX, event.clientY);
    if (!startPoint) return;

    setHoveredBlock(null);
    setDraftConnection({ fromBlockId, fromPortId, toPoint: startPoint });

    const handleMove = (moveEvent: PointerEvent) => {
      const nextPoint = getCanvasPoint(moveEvent.clientX, moveEvent.clientY);
      if (!nextPoint) return;
      nudgeViewportForScreenPoint(moveEvent.clientX, moveEvent.clientY);
      setDraftConnection({ fromBlockId, fromPortId, toPoint: nextPoint });
      setActiveInputTarget(
        findExactInputPort(moveEvent.clientX, moveEvent.clientY, fromBlockId),
      );
    };

    const handleUp = (upEvent: PointerEvent) => {
      const target = findExactInputPort(upEvent.clientX, upEvent.clientY, fromBlockId);
      if (target) {
        onAddConnection(fromBlockId, target.blockId, fromPortId, target.portId);
        const pulse = {
          fromBlockId,
          fromPortId,
          toBlockId: target.blockId,
          toPortId: target.portId,
          token: Date.now(),
        };
        setRecentConnection(pulse);
        window.setTimeout(() => {
          setRecentConnection((current) =>
            current?.token === pulse.token ? null : current,
          );
        }, 900);
      }
      setDraftConnection(null);
      setActiveInputTarget(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const zoomAtScreenPoint = (clientX: number, clientY: number, nextZoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onViewportChange({ ...viewport, zoom: nextZoom });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const canvasX = (screenX - viewport.panX) / viewport.zoom;
    const canvasY = (screenY - viewport.panY) / viewport.zoom;

    onViewportChange({
      zoom: nextZoom,
      panX: screenX - canvasX * nextZoom,
      panY: screenY - canvasY * nextZoom,
    });
  };

  const zoomBy = (delta: number) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    zoomAtScreenPoint(
      rect ? rect.left + rect.width / 2 : 0,
      rect ? rect.top + rect.height / 2 : 0,
      clampZoom(viewport.zoom + delta),
    );
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    zoomAtScreenPoint(
      event.clientX,
      event.clientY,
      clampZoom(viewport.zoom + delta),
    );
  };

  const resetView = () => {
    onViewportChange(DEFAULT_WORKFLOW_CANVAS_VIEWPORT);
  };

  const renderedSelectionRect = selectionBox ? getSelectionRect(selectionBox) : null;
  const isGroupDragging = dragPreviewState.previews.length > 1;

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-background/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Free workflow canvas</p>
          <p className="text-xs text-muted-foreground">
            Pan, zoom, select, and build the tool visually on the canvas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="mr-1 h-3.5 w-3.5" /> Undo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="mr-1 h-3.5 w-3.5" /> Redo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRequestDeleteSelection}
            disabled={!canDeleteSelection}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete selected
          </Button>
          <span className="mx-1 h-6 w-px bg-border" />
          <Button type="button" variant="outline" size="sm" onClick={() => zoomBy(-0.1)}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-14 text-center text-xs text-muted-foreground">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => zoomBy(0.1)}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={panMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPanMode(true)}
          >
            <Hand className="mr-1 h-3.5 w-3.5" /> Pan
          </Button>
          <Button
            type="button"
            variant={!panMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPanMode(false)}
          >
            <MousePointer2 className="mr-1 h-3.5 w-3.5" /> Select
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetView}>
            <LocateFixed className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative h-[640px] cursor-grab overflow-hidden bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.15)_1px,transparent_0)] [background-size:24px_24px] active:cursor-grabbing"
        onPointerDown={startPanOrSelection}
        onWheel={handleWheel}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: WORKFLOW_CANVAS_WIDTH,
            height: WORKFLOW_CANVAS_HEIGHT,
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          }}
          onPointerDown={() => onSelectConnection(null)}
        >
          <WorkflowCanvasConnections
            blocks={blocks}
            connections={connections}
            draftConnection={draftConnection}
            layouts={layouts}
            selectedConnectionId={selectedConnectionId}
            width={WORKFLOW_CANVAS_WIDTH}
            height={WORKFLOW_CANVAS_HEIGHT}
            onSelectConnection={onSelectConnection}
          />

          {isGroupDragging ? (
            <WorkflowConnectionPreviewArrows
              blocks={blocks}
              connections={connections}
              originalLayouts={layouts}
              previewLayouts={dragPreviewState.previewLayouts}
              movedBlockIds={dragPreviewState.movedBlockIds}
              width={WORKFLOW_CANVAS_WIDTH}
              height={WORKFLOW_CANVAS_HEIGHT}
            />
          ) : null}

          {renderedSelectionRect ? (
            <div
              className="pointer-events-none absolute rounded-2xl border border-primary bg-primary/10"
              style={renderedSelectionRect}
            />
          ) : null}

          {blocks.length === 0 ? (
            <div className="absolute left-1/2 top-40 w-80 -translate-x-1/2 rounded-3xl border bg-card/90 p-6 text-center shadow-xl">
              <Move3D className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Drop your first block anywhere</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The canvas is visually unbounded. Pan, zoom, or select an area.
              </p>
            </div>
          ) : null}

          {blocks.map((block, index) => (
            <WorkflowCanvasNode
              key={block.id}
              block={block}
              index={index}
              inputs={inputs}
              layout={layouts.get(block.id) ?? getBlockLayout(block, index)}
              selected={selectedBlockId === block.id || selectedBlockIds.includes(block.id)}
              suppressDetails={suppressDetails}
              activeInputTarget={activeInputTarget}
              connections={connections}
              recentConnection={recentConnection}
              onSelect={() => {
                onSelectConnection(null);
                onSelectBlock(block.id);
              }}
              onEdit={() => onEditBlock(block.id)}
              onDelete={() => onDeleteBlock(block.id)}
              onStartDrag={(event) => {
                if (!selectedBlockIds.includes(block.id)) {
                  onSelectBlocks([block.id]);
                }
                onStartBlockDrag(index, event);
              }}
              onStartConnection={(outputPortId, event) =>
                startConnectionDrag(block.id, outputPortId, event)
              }
              onLayoutChange={(layout) => onBlockLayoutChange(block.id, layout)}
              onHoverChange={setHoveredBlock}
              onHoverMove={setHoverPosition}
            />
          ))}

          {isGroupDragging ? (
            <GroupDragPreviewNodes previews={dragPreviewState.previews} />
          ) : (
            <WorkflowDragPreviewNode activeDrag={activeDrag} layout={dropPreview} />
          )}
        </div>

        <WorkflowNodeDetailsPopover
          block={hoveredBlock}
          inputs={inputs}
          position={hoverPosition}
        />

        <WorkflowConnectionToolbar
          blocks={blocks}
          connection={selectedConnection}
          position={selectedConnectionToolbarPosition}
          onDelete={() => {
            if (selectedConnection) onDeleteConnection(selectedConnection.id);
          }}
          onStyleChange={(style) => {
            if (selectedConnection) {
              onConnectionStyleChange(selectedConnection.id, style);
            }
          }}
          onEndpointChange={(endpoint, blockId) => {
            if (selectedConnection) {
              onConnectionEndpointChange(selectedConnection.id, endpoint, blockId);
            }
          }}
        />


      </div>
    </div>
  );
}
