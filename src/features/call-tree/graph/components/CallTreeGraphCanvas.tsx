import type { PointerEvent, RefObject, WheelEvent } from "react";
import { MousePointer2 } from "lucide-react";
import { LayoutResult, SVG_VIEWBOX_HEIGHT, SVG_VIEWBOX_WIDTH, TreeInstance, ViewportState } from "../model";
import { CallTreeGraphEdgeLayer, CallTreeGraphNode } from "./CallTreeGraphRenderers";

type CallTreeGraphCanvasProps = {
  viewportRef: RefObject<HTMLDivElement | null>;
  viewport: ViewportState;
  layout: LayoutResult;
  instanceById: Map<string, TreeInstance>;
  selectedNodeName: string | null;
  searchNeedle: string;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  onToggleSelectedNode: (nodeName: string) => void;
};

export function CallTreeGraphCanvas({
  viewportRef,
  viewport,
  layout,
  instanceById,
  selectedNodeName,
  searchNeedle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onToggleSelectedNode,
}: CallTreeGraphCanvasProps) {
  return (
    <div
      ref={viewportRef}
      className="relative h-205 overflow-hidden rounded-xl border bg-muted/20 touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div className="absolute left-3 top-3 z-10 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
        <span className="inline-flex items-center gap-1">
          <MousePointer2 className="size-3" />
          Drag to pan · wheel to zoom · {Math.round(viewport.scale * 100)}%
        </span>
      </div>

      <svg
        className="h-full w-full cursor-grab active:cursor-grabbing"
        viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="call-tree-arrow"
            markerWidth="14"
            markerHeight="14"
            refX="12"
            refY="7"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M2,2 L12,7 L2,12 Z"
              className="fill-muted-foreground"
            />
          </marker>

          <marker
            id="call-tree-arrow-active"
            markerWidth="14"
            markerHeight="14"
            refX="12"
            refY="7"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M2,2 L12,7 L2,12 Z" className="fill-primary" />
          </marker>
        </defs>

        <g
          transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
        >
          <CallTreeGraphEdgeLayer
            layout={layout}
            instanceById={instanceById}
            selectedNodeName={selectedNodeName}
            searchNeedle={searchNeedle}
          />

          {layout.instances.map((instance) => (
            <CallTreeGraphNode
              key={instance.instanceId}
              instance={instance}
              selectedNodeName={selectedNodeName}
              searchNeedle={searchNeedle}
              onToggleSelectedNode={onToggleSelectedNode}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}