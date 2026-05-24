import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";

type CProjectStatusBadgeProps = {
  status: CProjectWorkspaceState["status"];
};

export function CProjectStatusBadge({ status }: CProjectStatusBadgeProps) {
  if (status === "scanning") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        Scanning
      </Badge>
    );
  }

  if (status === "ready") {
    return <Badge variant="secondary">Ready</Badge>;
  }

  if (status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }

  return <Badge variant="outline">Idle</Badge>;
}