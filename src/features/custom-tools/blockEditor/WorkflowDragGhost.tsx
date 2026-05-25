import type { ActiveWorkflowPointerDrag } from "./workflowPointerDragTypes";

type WorkflowDragGhostProps = {
  activeDrag: ActiveWorkflowPointerDrag | null;
};

export function WorkflowDragGhost({ activeDrag: _activeDrag }: WorkflowDragGhostProps) {
  return null;
}
