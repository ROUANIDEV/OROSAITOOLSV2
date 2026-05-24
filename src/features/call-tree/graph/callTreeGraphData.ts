import type {
  CallTreeAnalysisResult,
  CallTreeCall,
  CallTreeFunction,
} from "@/lib/callTree";
import {
  asRecord,
  cleanText,
  normalizeSearch,
  readArray,
  readBoolean,
  readNumber,
  readString,
  uniqueStrings,
} from "@/features/call-tree/graph/callTreeGraphReadUtils";
import type {
  BuiltGraph,
  GraphEdge,
  GraphNode,
} from "@/features/call-tree/graph/callTreeGraphTypes";

export function buildGraph(
  analysis: CallTreeAnalysisResult,
  functions: CallTreeFunction[],
  calls: CallTreeCall[],
): BuiltGraph {
  const nodes = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

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

    upsertNode(nodes, name, {
      file,
      line: readNumber(record, ["line", "lineNumber", "line_number"]),
      callsCount: readNumber(record, ["callsCount", "calls_count"]),
      calledByCount: readNumber(record, ["calledByCount", "called_by_count"]),
      isRoot: readBoolean(record, ["isRoot", "is_root", "root"]),
    });
  }

  for (const call of calls) {
    addCallEdge(nodes, edgeMap, call);
  }

  const edges = Array.from(edgeMap.values());
  resetNodeCounts(nodes);
  countEdges(nodes, edges);

  const childrenByParent = buildChildrenByParent(edges);
  const incomingByChild = buildIncomingByChild(edges);

  sortChildrenByParent(childrenByParent, nodes);

  const roots = buildRootNames(analysis, nodes);

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

export function nodeMatchesSearch(
  node: GraphNode,
  searchNeedle: string,
): boolean {
  const haystack = normalizeSearch(
    [node.name, node.file, String(node.line)].join(" "),
  );

  return haystack.includes(searchNeedle);
}

function addCallEdge(
  nodes: Map<string, GraphNode>,
  edgeMap: Map<string, GraphEdge>,
  call: CallTreeCall,
) {
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
    return;
  }

  const file = readString(record, [
    "relativePath",
    "relative_path",
    "file",
    "filePath",
    "file_path",
  ]);
  const line = readNumber(record, ["line", "lineNumber", "line_number"]);

  upsertNode(nodes, from);
  upsertNode(nodes, to);

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

function upsertNode(
  nodes: Map<string, GraphNode>,
  name: string,
  patch?: Partial<GraphNode>,
) {
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

function resetNodeCounts(nodes: Map<string, GraphNode>) {
  for (const node of nodes.values()) {
    node.outgoingCount = 0;
    node.incomingCount = 0;
  }
}

function countEdges(nodes: Map<string, GraphNode>, edges: GraphEdge[]) {
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
}

function buildChildrenByParent(edges: GraphEdge[]): Map<string, GraphEdge[]> {
  const childrenByParent = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    const outgoing = childrenByParent.get(edge.from) ?? [];
    outgoing.push(edge);
    childrenByParent.set(edge.from, outgoing);
  }

  return childrenByParent;
}

function buildIncomingByChild(edges: GraphEdge[]): Map<string, GraphEdge[]> {
  const incomingByChild = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    const incoming = incomingByChild.get(edge.to) ?? [];
    incoming.push(edge);
    incomingByChild.set(edge.to, incoming);
  }

  return incomingByChild;
}

function sortChildrenByParent(
  childrenByParent: Map<string, GraphEdge[]>,
  nodes: Map<string, GraphNode>,
) {
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
}

function buildRootNames(
  analysis: CallTreeAnalysisResult,
  nodes: Map<string, GraphNode>,
): string[] {
  const explicitRoots = readRootFunctionNames(analysis).filter((name) =>
    nodes.has(name),
  );
  const functionRoots = sortedNodeNames(nodes, (node) => node.isRoot);
  const zeroIncomingRoots = sortedNodeNames(
    nodes,
    (node) => node.incomingCount === 0 && node.outgoingCount > 0,
  );
  const fallbackRoots = sortedNodeNames(nodes, () => true);

  return uniqueStrings([
    ...explicitRoots,
    ...functionRoots,
    ...zeroIncomingRoots,
    ...fallbackRoots,
  ]);
}

function sortedNodeNames(
  nodes: Map<string, GraphNode>,
  filter: (node: GraphNode) => boolean,
): string[] {
  return Array.from(nodes.values())
    .filter(filter)
    .sort((a, b) => {
      return b.outgoingCount - a.outgoingCount || a.name.localeCompare(b.name);
    })
    .map((node) => node.name);
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