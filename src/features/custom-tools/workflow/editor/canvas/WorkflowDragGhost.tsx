import type { ActiveWorkflowPointerDrag } from "../../graph/workflowPointerDragTypes";

type WorkflowDragGhostProps = {
  activeDrag: ActiveWorkflowPointerDrag | null;
};

export function WorkflowDragGhost({
  activeDrag: _activeDrag,
}: WorkflowDragGhostProps) {
  return null;
}