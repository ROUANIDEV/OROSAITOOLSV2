import type {
  CallTreeAnalysisResult,
  CallTreeCall,
  CallTreeFunction,
} from "@/lib/callTree";

export type CallTreeGraphProps = {
  analysis: CallTreeAnalysisResult;
  functions: CallTreeFunction[];
  calls: CallTreeCall[];
};

export type RawRecord = Record<string, unknown>;

export type GraphNode = {
  name: string;
  file: string;
  line: number;
  callsCount: number;
  calledByCount: number;
  isRoot: boolean;
  outgoingCount: number;
  incomingCount: number;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  file: string;
  line: number;
};

export type BuiltGraph = {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  roots: string[];
  childrenByParent: Map<string, GraphEdge[]>;
  incomingByChild: Map<string, GraphEdge[]>;
};

export type TreeInstance = {
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

export type TreeEdgeInstance = {
  id: string;
  fromInstanceId: string;
  toInstanceId: string;
  edge: GraphEdge;
};

export type LayoutResult = {
  instances: TreeInstance[];
  edges: TreeEdgeInstance[];
  width: number;
  height: number;
  truncated: boolean;
  renderedRootCount: number;
  totalRootCount: number;
};

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};