import { LocateFixed } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CallTreeGraphSelectedNode } from "@/features/call-tree/graph/CallTreeGraphSelectedNode";
import type {
  GraphNode,
  LayoutResult,
} from "@/features/call-tree/graph/callTreeGraphTypes";
import {
  GraphInfoRow,
  GraphMetric,
  LegendItem,
} from "@/features/call-tree/graph/CallTreeGraphInfo";

type CallTreeGraphSidebarProps = {
  layout: LayoutResult;
  nodeCount: number;
  edgeCount: number;
  matchingNodeCount: number;
  searchNeedle: string;
  selectedNode: GraphNode | null;
};

export function CallTreeGraphSidebar({
  layout,
  nodeCount,
  edgeCount,
  matchingNodeCount,
  searchNeedle,
  selectedNode,
}: CallTreeGraphSidebarProps) {
  return (
    <aside className="grid content-start gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LocateFixed className="size-5" />
            Graph status
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <GraphMetric label="Functions" value={nodeCount} />
            <GraphMetric label="Calls" value={edgeCount} />
          </div>

          <Separator />

          <GraphInfoRow
            label="Rendered nodes"
            value={layout.instances.length}
          />
          <GraphInfoRow label="Rendered calls" value={layout.edges.length} />
          <GraphInfoRow
            label="Roots shown"
            value={`${layout.renderedRootCount}/${layout.totalRootCount}`}
          />

          {searchNeedle ? (
            <GraphInfoRow label="Search matches" value={matchingNodeCount} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected function</CardTitle>
        </CardHeader>

        <CardContent>
          <CallTreeGraphSelectedNode selectedNode={selectedNode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 text-sm">
          <LegendItem
            label="Root function"
            className="border-primary bg-primary/10"
          />
          <LegendItem
            label="Selected function"
            className="border-primary ring-2 ring-primary/30"
          />
          <LegendItem
            label="Repeated function"
            className="border-dashed border-muted-foreground"
          />
          <LegendItem
            label="Cycle"
            className="border-destructive bg-destructive/10"
          />

          <p className="text-xs leading-relaxed text-muted-foreground">
            For very large call graphs, the view is safely limited by depth,
            children per node, and total rendered nodes. Increase depth or
            children only when needed.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}