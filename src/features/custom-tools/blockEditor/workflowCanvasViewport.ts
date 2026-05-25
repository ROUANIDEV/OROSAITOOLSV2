export type WorkflowCanvasViewport = {
  panX: number;
  panY: number;
  zoom: number;
};

export const DEFAULT_WORKFLOW_CANVAS_VIEWPORT: WorkflowCanvasViewport = {
  panX: 48,
  panY: 48,
  zoom: 0.9,
};

export function clampZoom(zoom: number) {
  return Math.min(1.8, Math.max(0.35, zoom));
}
