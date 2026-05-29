import {
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";

import { Card, CardContent } from "@/components/ui/card";
import { buildGraph, CallTreeGraphProps, clamp, DEFAULT_MAX_CHILDREN, DEFAULT_MAX_DEPTH, DEFAULT_SCALE, DragState, layoutGraph, MAX_SCALE, MIN_SCALE, nodeMatchesSearch, normalizeSearch, SVG_VIEWBOX_HEIGHT, SVG_VIEWBOX_WIDTH, TreeInstance, ViewportState } from "../model";
import { CallTreeGraphEmptyState } from "./CallTreeGraphEmptyState";
import { CallTreeGraphHeader } from "./CallTreeGraphHeader";
import { CallTreeGraphCanvas } from "./CallTreeGraphCanvas";
import { CallTreeGraphSidebar } from "./CallTreeGraphSidebar";


export function CallTreeGraph({
  analysis,
  functions,
  calls,
}: CallTreeGraphProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH);
  const [maxChildren, setMaxChildren] = useState(DEFAULT_MAX_CHILDREN);
  const [viewport, setViewport] = useState<ViewportState>({
    x: 80,
    y: 90,
    scale: DEFAULT_SCALE,
  });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const graph = useMemo(
    () => buildGraph(analysis, functions, calls),
    [analysis, functions, calls],
  );
  const layout = useMemo(
    () => layoutGraph(graph, maxDepth, maxChildren),
    [graph, maxDepth, maxChildren],
  );
  const instanceById = useMemo(() => {
    const map = new Map<string, TreeInstance>();

    for (const instance of layout.instances) {
      map.set(instance.instanceId, instance);
    }

    return map;
  }, [layout.instances]);

  const searchNeedle = normalizeSearch(searchTerm);
  const selectedNode =
    selectedNodeName && graph.nodes.has(selectedNodeName)
      ? graph.nodes.get(selectedNodeName) ?? null
      : null;
  const matchingNodeCount = searchNeedle
    ? layout.instances.filter((instance: { node: any; }) =>
        nodeMatchesSearch(instance.node, searchNeedle),
      ).length
    : 0;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) {
      return;
    }

    setViewport((current) => ({
      ...current,
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY,
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current.active = false;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const container = viewportRef.current;

    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * SVG_VIEWBOX_WIDTH;
    const pointerY =
      ((event.clientY - rect.top) / rect.height) * SVG_VIEWBOX_HEIGHT;
    const nextScale = clamp(
      viewport.scale * (event.deltaY > 0 ? 0.88 : 1.14),
      MIN_SCALE,
      MAX_SCALE,
    );
    const graphXBefore = (pointerX - viewport.x) / viewport.scale;
    const graphYBefore = (pointerY - viewport.y) / viewport.scale;

    setViewport({
      scale: nextScale,
      x: pointerX - graphXBefore * nextScale,
      y: pointerY - graphYBefore * nextScale,
    });
  }

  function zoomBy(multiplier: number) {
    setViewport((current) => ({
      ...current,
      scale: clamp(current.scale * multiplier, MIN_SCALE, MAX_SCALE),
    }));
  }

  function resetView() {
    setViewport({ x: 80, y: 90, scale: DEFAULT_SCALE });
  }

  function toggleSelectedNode(nodeName: string) {
    setSelectedNodeName((current) => (current === nodeName ? null : nodeName));
  }

  if (graph.nodes.size === 0) {
    return <CallTreeGraphEmptyState />;
  }

  return (
    <Card>
      <CallTreeGraphHeader
        truncated={layout.truncated}
        searchTerm={searchTerm}
        maxDepth={maxDepth}
        maxChildren={maxChildren}
        onSearchTermChange={setSearchTerm}
        onMaxDepthChange={setMaxDepth}
        onMaxChildrenChange={setMaxChildren}
        onZoomIn={() => zoomBy(1.25)}
        onZoomOut={() => zoomBy(0.8)}
        onResetView={resetView}
      />

      <CardContent className="grid gap-4">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <CallTreeGraphCanvas
            viewportRef={viewportRef}
            viewport={viewport}
            layout={layout}
            instanceById={instanceById}
            selectedNodeName={selectedNodeName}
            searchNeedle={searchNeedle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            onToggleSelectedNode={toggleSelectedNode}
          />

          <CallTreeGraphSidebar
            layout={layout}
            nodeCount={graph.nodes.size}
            edgeCount={graph.edges.length}
            matchingNodeCount={matchingNodeCount}
            searchNeedle={searchNeedle}
            selectedNode={selectedNode}
          />
        </section>
      </CardContent>
    </Card>
  );
}