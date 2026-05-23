import {
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  GitBranch,
  LocateFixed,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type {
  CallTreeAnalysisResult,
  CallTreeCall,
  CallTreeFunction,
} from "@/lib/callTree";
import { cn } from "@/lib/utils";

const SVG_VIEWBOX_WIDTH = 1600;
const SVG_VIEWBOX_HEIGHT = 820;

const NODE_WIDTH = 340;
const NODE_HEIGHT = 118;
const LEVEL_GAP = 210;
const ROW_GAP = 54;
const ROOT_GAP = 90;
const PADDING = 90;

const MAX_LAYOUT_NODES = 520;
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_CHILDREN = 12;
const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.35;
const MAX_SCALE = 5;

type CallTreeGraphProps = {
  analysis: CallTreeAnalysisResult;
  functions: CallTreeFunction[];
  calls: CallTreeCall[];
};

type RawRecord = Record<string, unknown>;

type GraphNode = {
  name: string;
  file: string;
  line: number;
  callsCount: number;
  calledByCount: number;
  isRoot: boolean;
  outgoingCount: number;
  incomingCount: number;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  file: string;
  line: number;
};

type BuiltGraph = {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  roots: string[];
  childrenByParent: Map<string, GraphEdge[]>;
  incomingByChild: Map<string, GraphEdge[]>;
};

type TreeInstance = {
  instanceId: string;
  name: string;
  node: GraphNode;
  depth: number;
  x: number;
  y: number;
  cycle: boolean;
  repeated: boolean;
  hiddenChildren: number;
};

type TreeEdgeInstance = {
  id: string;
  fromInstanceId: string;
  toInstanceId: string;
  edge: GraphEdge;
};

type LayoutResult = {
  instances: TreeInstance[];
  edges: TreeEdgeInstance[];
  width: number;
  height: number;
  truncated: boolean;
  renderedRootCount: number;
  totalRootCount: number;
};

type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const DEPTH_OPTIONS = [4, 6, 8, 10];
const CHILD_OPTIONS = [6, 12, 24];

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
    ? layout.instances.filter((instance) =>
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

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    setViewport((current) => ({
      ...current,
      x: dragRef.current.originX + deltaX,
      y: dragRef.current.originY + deltaY,
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
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
    setViewport({
      x: 80,
      y: 90,
      scale: DEFAULT_SCALE,
    });
  }

  if (graph.nodes.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="size-5" />
            Call Tree Graph
          </CardTitle>
          <CardDescription>
            No graph data is available. Run Analyze Call Tree first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Interactive</Badge>
              <Badge variant="outline">Branched graph</Badge>
              {layout.truncated && (
                <Badge variant="destructive">Large graph trimmed</Badge>
              )}
            </div>

            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-5" />
              Call Tree Graph
            </CardTitle>

            <CardDescription>
              Pan the canvas, zoom in/out, search functions, and click nodes to
              inspect branches.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => zoomBy(1.25)}
            >
              <Plus className="size-4" />
              Zoom in
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => zoomBy(0.8)}
            >
              <Minus className="size-4" />
              Zoom out
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search function name, file, or line..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Depth</span>
            {DEPTH_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={maxDepth === option ? "default" : "outline"}
                size="sm"
                onClick={() => setMaxDepth(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Children</span>
            {CHILD_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={maxChildren === option ? "default" : "outline"}
                size="sm"
                onClick={() => setMaxChildren(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div
            ref={viewportRef}
            className="relative h-205 overflow-hidden rounded-xl border bg-muted/20 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
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

                {layout.instances.map((instance) => {
                  const isSelected = selectedNodeName === instance.name;
                  const isSearchMatch =
                    searchNeedle && nodeMatchesSearch(instance.node, searchNeedle);
                  const isDimmed = searchNeedle && !isSearchMatch && !isSelected;

                  return (
                    <foreignObject
                      key={instance.instanceId}
                      x={instance.x}
                      y={instance.y}
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() =>
                          setSelectedNodeName((current) =>
                            current === instance.name ? null : instance.name,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedNodeName((current) =>
                              current === instance.name ? null : instance.name,
                            );
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
                })}
              </g>
            </svg>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <LocateFixed className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Graph status</p>
              </div>

              <div className="mt-4 grid gap-3 text-sm">
                <GraphInfoRow label="Functions" value={graph.nodes.size} />
                <GraphInfoRow label="Calls" value={graph.edges.length} />
                <GraphInfoRow
                  label="Rendered nodes"
                  value={layout.instances.length}
                />
                <GraphInfoRow
                  label="Root branches"
                  value={`${layout.renderedRootCount}/${layout.totalRootCount}`}
                />
                <GraphInfoRow
                  label="Search matches"
                  value={searchNeedle ? matchingNodeCount : "—"}
                />
                <GraphInfoRow
                  label="Zoom"
                  value={`${Math.round(viewport.scale * 100)}%`}
                />
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Selected function</p>

              {selectedNode ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="break-all font-medium">{selectedNode.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">File</p>
                    <p className="break-all font-mono text-xs">
                      {selectedNode.file || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <GraphMetric label="Line" value={selectedNode.line || "—"} />
                    <GraphMetric
                      label="Called by"
                      value={selectedNode.incomingCount}
                    />
                    <GraphMetric label="Calls" value={selectedNode.outgoingCount} />
                    <GraphMetric
                      label="Type"
                      value={selectedNode.isRoot ? "Root" : "Function"}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Click any node in the graph to inspect it and highlight its
                  connected branches.
                </p>
              )}
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Legend</p>

              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <LegendItem label="Root function" className="border-primary" />
                <LegendItem label="Normal function" className="border-border" />
                <LegendItem label="Repeated shared call" className="border-dashed" />
                <LegendItem
                  label="Cycle protected"
                  className="border-destructive/70"
                />
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-muted-foreground">
                For very large call graphs, the view is safely limited by depth,
                children per node, and total rendered nodes. Increase depth or
                children only when needed.
              </p>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}

function buildGraph(
  analysis: CallTreeAnalysisResult,
  functions: CallTreeFunction[],
  calls: CallTreeCall[],
): BuiltGraph {
  const nodes = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  function upsertNode(name: string, patch?: Partial<GraphNode>) {
    const cleanName = cleanText(name);

    if (!cleanName) {
      return;
    }

    const existing = nodes.get(cleanName);

    if (existing) {
      nodes.set(cleanName, {
        ...existing,
        ...patch,
        file: patch?.file || existing.file,
        line: patch?.line || existing.line,
        callsCount: patch?.callsCount ?? existing.callsCount,
        calledByCount: patch?.calledByCount ?? existing.calledByCount,
        isRoot: patch?.isRoot ?? existing.isRoot,
      });
      return;
    }

    nodes.set(cleanName, {
      name: cleanName,
      file: patch?.file ?? "",
      line: patch?.line ?? 0,
      callsCount: patch?.callsCount ?? 0,
      calledByCount: patch?.calledByCount ?? 0,
      isRoot: patch?.isRoot ?? false,
      outgoingCount: 0,
      incomingCount: 0,
    });
  }

  for (const functionItem of functions) {
    const record = asRecord(functionItem);
    const name = readString(record, ["name", "functionName", "function_name"]);
    const file = readString(record, [
      "relativePath",
      "relative_path",
      "file",
      "filePath",
      "file_path",
    ]);

    upsertNode(name, {
      file,
      line: readNumber(record, ["line", "lineNumber", "line_number"]),
      callsCount: readNumber(record, ["callsCount", "calls_count"]),
      calledByCount: readNumber(record, ["calledByCount", "called_by_count"]),
      isRoot: readBoolean(record, ["isRoot", "is_root", "root"]),
    });
  }

  for (const call of calls) {
    const record = asRecord(call);

    const from = readString(record, [
      "caller",
      "callingFunction",
      "calling_function",
      "from",
      "source",
    ]);

    const to = readString(record, [
      "callee",
      "calledFunction",
      "called_function",
      "to",
      "target",
    ]);

    if (!from || !to) {
      continue;
    }

    const file = readString(record, [
      "relativePath",
      "relative_path",
      "file",
      "filePath",
      "file_path",
    ]);

    const line = readNumber(record, ["line", "lineNumber", "line_number"]);

    upsertNode(from);
    upsertNode(to);

    const edgeKey = `${from}=>${to}=>${file}=>${line}`;

    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, {
        id: edgeKey,
        from,
        to,
        file,
        line,
      });
    }
  }

  const edges = Array.from(edgeMap.values());

  for (const node of nodes.values()) {
    node.outgoingCount = 0;
    node.incomingCount = 0;
  }

  for (const edge of edges) {
    const fromNode = nodes.get(edge.from);
    const toNode = nodes.get(edge.to);

    if (fromNode) {
      fromNode.outgoingCount += 1;
      fromNode.callsCount = Math.max(fromNode.callsCount, fromNode.outgoingCount);
    }

    if (toNode) {
      toNode.incomingCount += 1;
      toNode.calledByCount = Math.max(
        toNode.calledByCount,
        toNode.incomingCount,
      );
    }
  }

  const childrenByParent = new Map<string, GraphEdge[]>();
  const incomingByChild = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    const outgoing = childrenByParent.get(edge.from) ?? [];
    outgoing.push(edge);
    childrenByParent.set(edge.from, outgoing);

    const incoming = incomingByChild.get(edge.to) ?? [];
    incoming.push(edge);
    incomingByChild.set(edge.to, incoming);
  }

  for (const [parent, childEdges] of childrenByParent.entries()) {
    const sortedChildEdges = childEdges.sort((a, b) => {
      const aNode = nodes.get(a.to);
      const bNode = nodes.get(b.to);

      return (
        (bNode?.outgoingCount ?? 0) - (aNode?.outgoingCount ?? 0) ||
        a.to.localeCompare(b.to)
      );
    });

    childrenByParent.set(parent, sortedChildEdges);
  }

  const explicitRoots = readRootFunctionNames(analysis).filter((name) =>
    nodes.has(name),
  );

  const zeroIncomingRoots = Array.from(nodes.values())
    .filter((node) => node.incomingCount === 0 && node.outgoingCount > 0)
    .sort((a, b) => {
      return (
        b.outgoingCount - a.outgoingCount || a.name.localeCompare(b.name)
      );
    })
    .map((node) => node.name);

  const functionRoots = Array.from(nodes.values())
    .filter((node) => node.isRoot)
    .sort((a, b) => {
      return (
        b.outgoingCount - a.outgoingCount || a.name.localeCompare(b.name)
      );
    })
    .map((node) => node.name);

  const fallbackRoots = Array.from(nodes.values())
    .sort((a, b) => {
      return (
        b.outgoingCount - a.outgoingCount || a.name.localeCompare(b.name)
      );
    })
    .map((node) => node.name);

  const roots = uniqueStrings([
    ...explicitRoots,
    ...functionRoots,
    ...zeroIncomingRoots,
    ...fallbackRoots,
  ]);

  for (const rootName of roots) {
    const node = nodes.get(rootName);

    if (node) {
      node.isRoot = true;
    }
  }

  return {
    nodes,
    edges,
    roots,
    childrenByParent,
    incomingByChild,
  };
}

function layoutGraph(
  graph: BuiltGraph,
  maxDepth: number,
  maxChildren: number,
): LayoutResult {
  const instances: TreeInstance[] = [];
  const treeEdges: TreeEdgeInstance[] = [];
  const seenNames = new Set<string>();

  let nextY = PADDING;
  let truncated = false;
  let renderedCount = 0;
  let maxRenderedDepth = 0;

  const roots = graph.roots.slice(0, Math.min(14, graph.roots.length));

  if (graph.roots.length > roots.length) {
    truncated = true;
  }

  function walk(name: string, depth: number, path: string[]): TreeInstance | null {
    if (renderedCount >= MAX_LAYOUT_NODES) {
      truncated = true;
      return null;
    }

    const node = graph.nodes.get(name);

    if (!node) {
      return null;
    }

    const cycle = path.includes(name);
    const repeated = seenNames.has(name);
    const instanceId = `${slugify(name)}-${renderedCount}`;

    renderedCount += 1;
    seenNames.add(name);
    maxRenderedDepth = Math.max(maxRenderedDepth, depth);

    const childEdges = graph.childrenByParent.get(name) ?? [];
    const canRenderChildren = !cycle && depth < maxDepth;
    const visibleChildEdges = canRenderChildren
      ? childEdges.slice(0, maxChildren)
      : [];

    const hiddenChildren = canRenderChildren
      ? childEdges.length - visibleChildEdges.length
      : childEdges.length;

    if (hiddenChildren > 0) {
      truncated = true;
    }

    const childInstances: TreeInstance[] = [];

    for (const edge of visibleChildEdges) {
      const child = walk(edge.to, depth + 1, [...path, name]);

      if (!child) {
        continue;
      }

      childInstances.push(child);
      treeEdges.push({
        id: `${instanceId}->${child.instanceId}`,
        fromInstanceId: instanceId,
        toInstanceId: child.instanceId,
        edge,
      });
    }

    const y =
      childInstances.length > 0
        ? average(childInstances.map((child) => child.y))
        : nextY;

    if (childInstances.length === 0) {
      nextY += NODE_HEIGHT + ROW_GAP;
    }

    const instance: TreeInstance = {
      instanceId,
      name,
      node,
      depth,
      x: PADDING + depth * (NODE_WIDTH + LEVEL_GAP),
      y,
      cycle,
      repeated,
      hiddenChildren: Math.max(0, hiddenChildren),
    };

    instances.push(instance);

    return instance;
  }

  for (const root of roots) {
    walk(root, 0, []);
    nextY += ROOT_GAP;
  }

  return {
    instances,
    edges: treeEdges,
    width: PADDING * 2 + (maxRenderedDepth + 1) * (NODE_WIDTH + LEVEL_GAP),
    height: Math.max(nextY + PADDING, SVG_VIEWBOX_HEIGHT),
    truncated,
    renderedRootCount: roots.length,
    totalRootCount: graph.roots.length,
  };
}

function GraphInfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function GraphMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-4 rounded border-2 bg-card", className)} />
      <span>{label}</span>
    </div>
  );
}

function readRootFunctionNames(analysis: CallTreeAnalysisResult): string[] {
  const record = asRecord(analysis);
  const values = readArray(record, ["rootFunctions", "root_functions", "roots"]);

  return values
    .map((value) => {
      if (typeof value === "string") {
        return cleanText(value);
      }

      const item = asRecord(value);

      return readString(item, ["name", "functionName", "function_name"]);
    })
    .filter(Boolean);
}

function nodeMatchesSearch(node: GraphNode, searchNeedle: string): boolean {
  const haystack = normalizeSearch(
    [node.name, node.file, String(node.line)].join(" "),
  );

  return haystack.includes(searchNeedle);
}

function asRecord(value: unknown): RawRecord {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as RawRecord;
  }

  return {};
}

function readArray(record: RawRecord, keys: string[]): unknown[] {
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readString(record: RawRecord, keys: string[], fallback = ""): string {
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function readNumber(record: RawRecord, keys: string[], fallback = 0): number {
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function readBoolean(
  record: RawRecord,
  keys: string[],
  fallback = false,
): boolean {
  const normalizedKeys = new Map<string, string>();

  for (const key of Object.keys(record)) {
    normalizedKeys.set(normalizeKey(key), key);
  }

  for (const wantedKey of keys) {
    const realKey = normalizedKeys.get(normalizeKey(wantedKey));

    if (!realKey) {
      continue;
    }

    const value = record[realKey];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "yes", "1", "root"].includes(normalized)) {
        return true;
      }

      if (["false", "no", "0"].includes(normalized)) {
        return false;
      }
    }
  }

  return fallback;
}

function cleanText(value: string): string {
  return value.trim();
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string): string {
  return value.replace(/[_\-\s]/g, "").toLowerCase();
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleanValue = cleanText(value);

    if (!cleanValue || seen.has(cleanValue)) {
      continue;
    }

    seen.add(cleanValue);
    result.push(cleanValue);
  }

  return result;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function slugify(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
