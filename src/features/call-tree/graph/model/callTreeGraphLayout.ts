import { LEVEL_GAP, MAX_LAYOUT_NODES, NODE_HEIGHT, NODE_WIDTH, PADDING, ROOT_GAP, ROW_GAP, SVG_VIEWBOX_HEIGHT } from "./callTreeGraphConstants";
import { average, slugify } from "./callTreeGraphReadUtils";
import { BuiltGraph, LayoutResult, TreeEdgeInstance, TreeInstance } from "./callTreeGraphTypes";

export function layoutGraph(
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

  function walk(
    name: string,
    depth: number,
    path: string[],
  ): TreeInstance | null {
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