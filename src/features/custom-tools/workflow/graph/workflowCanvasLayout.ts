import type { CustomToolBlock } from "../../domain/customToolTypes";

export type WorkflowBlockLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type BlockWithLayout = CustomToolBlock & {
  layout?: Partial<WorkflowBlockLayout>;
};

/**
 * These dimensions are only a technical SVG/grid surface.
 * Block positions are no longer clamped to this rectangle.
 */
export const WORKFLOW_CANVAS_WIDTH = 12000;
export const WORKFLOW_CANVAS_HEIGHT = 8000;
export const WORKFLOW_CANVAS_MARGIN = 0;

export const WORKFLOW_CANVAS_MIN_X = -100000;
export const WORKFLOW_CANVAS_MIN_Y = -100000;
export const WORKFLOW_CANVAS_MAX_X = 100000;
export const WORKFLOW_CANVAS_MAX_Y = 100000;

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;

const MIN_WIDTH = 220;
const MAX_WIDTH = 560;

const MIN_HEIGHT = 118;
const MAX_HEIGHT = 360;

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getBlockLayout(
  block: CustomToolBlock,
  index = 0,
): WorkflowBlockLayout {
  const layout = (block as BlockWithLayout).layout ?? {};

  const fallbackX = 120 + (index % 4) * 380;
  const fallbackY = 120 + Math.floor(index / 4) * 260;

  const width = clampNumber(
    toNumber(layout.width, DEFAULT_WIDTH),
    MIN_WIDTH,
    MAX_WIDTH,
  );

  const height = clampNumber(
    toNumber(layout.height, DEFAULT_HEIGHT),
    MIN_HEIGHT,
    MAX_HEIGHT,
  );

  return {
    x: toNumber(layout.x, fallbackX),
    y: toNumber(layout.y, fallbackY),
    width,
    height,
  };
}

export function withBlockLayout(
  block: CustomToolBlock,
  patch: Partial<WorkflowBlockLayout>,
  index = 0,
): CustomToolBlock {
  const currentLayout = getBlockLayout(block, index);

  const nextWidth = clampNumber(
    patch.width ?? currentLayout.width,
    MIN_WIDTH,
    MAX_WIDTH,
  );

  const nextHeight = clampNumber(
    patch.height ?? currentLayout.height,
    MIN_HEIGHT,
    MAX_HEIGHT,
  );

  return {
    ...block,
    layout: {
      x: patch.x ?? currentLayout.x,
      y: patch.y ?? currentLayout.y,
      width: nextWidth,
      height: nextHeight,
    },
  } as CustomToolBlock;
}

export function getDropPreviewLayout(point: {
  x: number;
  y: number;
}): WorkflowBlockLayout {
  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;

  return {
    x: point.x - width / 2,
    y: point.y - height / 2,
    width,
    height,
  };
}