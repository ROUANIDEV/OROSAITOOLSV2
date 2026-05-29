import { GitBranch } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CallTreeGraphEmptyState() {
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