import type { WorkflowBlockLayout } from "../../graph/workflowCanvasLayout";
import type { ActiveWorkflowPointerDrag } from "../../graph/workflowPointerDragTypes";

type WorkflowDragPreviewNodeProps = {
  activeDrag: ActiveWorkflowPointerDrag | null;
  layout: WorkflowBlockLayout | null;
};

export function WorkflowDragPreviewNode({
  activeDrag,
  layout,
}: WorkflowDragPreviewNodeProps) {
  if (!activeDrag || !layout) return null;

  return (
    <div
      className="pointer-events-none absolute z-80 rounded-2xl border-2 border-primary/70 bg-background/55 p-3 pb-6 opacity-75 shadow-2xl backdrop-blur-sm"
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="rounded-lg border bg-muted/70 p-1.5 text-muted-foreground">
            <span className="block h-4 w-4 rounded bg-muted-foreground/40" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {activeDrag.label}
            </p>

            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {activeDrag.blockType}
            </p>
          </div>
        </div>

        <p className="min-h-0 flex-1 overflow-hidden text-xs leading-relaxed text-muted-foreground">
          Preview of where this block will be dropped.
        </p>

        <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
          <span className="truncate rounded-full bg-muted/70 px-2 py-1">
            input preview
          </span>

          <span className="truncate rounded-full bg-muted/70 px-2 py-1">
            output preview
          </span>
        </div>
      </div>
    </div>
  );
}