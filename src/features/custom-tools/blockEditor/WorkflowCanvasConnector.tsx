import type { CustomToolBlock } from "../model/customToolTypes";
import {
  getConnectionClassName,
  getConnectionLabel,
} from "./workflowBlockMetadata";

type WorkflowCanvasConnectorProps = {
  from: CustomToolBlock;
  to: CustomToolBlock;
};

export function WorkflowCanvasConnector({
  from,
  to,
}: WorkflowCanvasConnectorProps) {
  return (
    <div className="flex w-full items-center justify-center py-2">
      <div className="flex flex-col items-center gap-1">
        <span className="h-3 w-3 rounded-full border bg-background shadow-sm" />
        <div
          className={`h-8 border-l-2 border-muted-foreground/70 ${getConnectionClassName(
            from,
            to,
          )}`}
        />
        <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
          ↓ {getConnectionLabel(from, to)}
        </div>
        <div
          className={`h-8 border-l-2 border-muted-foreground/70 ${getConnectionClassName(
            from,
            to,
          )}`}
        />
        <span className="h-3 w-3 rounded-full border bg-background shadow-sm" />
      </div>
    </div>
  );
}