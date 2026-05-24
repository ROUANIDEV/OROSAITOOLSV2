import type { GraphNode } from "@/features/call-tree/graph/callTreeGraphTypes";
import { GraphInfoRow } from "@/features/call-tree/graph/CallTreeGraphInfo";

type CallTreeGraphSelectedNodeProps = {
  selectedNode: GraphNode | null;
};

export function CallTreeGraphSelectedNode({
  selectedNode,
}: CallTreeGraphSelectedNodeProps) {
  if (!selectedNode) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Click any node in the graph to inspect it and highlight its connected
        branches.
      </div>
    );
  }

  return (
    <div className="grid gap-3 text-sm">
      <GraphInfoRow label="Name" value={selectedNode.name} />
      <GraphInfoRow label="File" value={selectedNode.file || "—"} />
      <GraphInfoRow label="Line" value={selectedNode.line || "—"} />
      <GraphInfoRow label="Calls" value={selectedNode.outgoingCount} />
      <GraphInfoRow label="Called by" value={selectedNode.incomingCount} />
    </div>
  );
}