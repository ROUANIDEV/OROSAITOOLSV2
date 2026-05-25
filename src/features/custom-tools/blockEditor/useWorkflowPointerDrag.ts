import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import type { CustomToolBlockType } from "../model/customToolTypes";
import type { WorkflowCanvasViewport } from "./workflowCanvasViewport";
import type {
  ActiveWorkflowPointerDrag,
  WorkflowCanvasPoint,
} from "./workflowPointerDragTypes";

type UseWorkflowPointerDragParams = {
  viewport: WorkflowCanvasViewport;
  onAddBlockAtPoint: (
    type: CustomToolBlockType,
    point: WorkflowCanvasPoint,
  ) => void;
  onMoveBlockToPoint: (fromIndex: number, point: WorkflowCanvasPoint) => void;
};

export function useWorkflowPointerDrag({
  viewport,
  onAddBlockAtPoint,
  onMoveBlockToPoint,
}: UseWorkflowPointerDragParams) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef(viewport);
  const activeDragRef = useRef<ActiveWorkflowPointerDrag | null>(null);
  const addBlockRef = useRef(onAddBlockAtPoint);
  const moveBlockRef = useRef(onMoveBlockToPoint);
  const [activeDrag, setActiveDrag] =
    useState<ActiveWorkflowPointerDrag | null>(null);
  const [activeCanvasPoint, setActiveCanvasPoint] =
    useState<WorkflowCanvasPoint | null>(null);

  const isDragging = activeDrag !== null;

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    activeDragRef.current = activeDrag;
  }, [activeDrag]);

  useEffect(() => {
    addBlockRef.current = onAddBlockAtPoint;
  }, [onAddBlockAtPoint]);

  useEffect(() => {
    moveBlockRef.current = onMoveBlockToPoint;
  }, [onMoveBlockToPoint]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const insideCanvas =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    if (!insideCanvas) return null;

    const currentViewport = viewportRef.current;

    return {
      x: (clientX - rect.left - currentViewport.panX) / currentViewport.zoom,
      y: (clientY - rect.top - currentViewport.panY) / currentViewport.zoom,
    };
  };

  const startNewBlockDrag = (
    blockType: CustomToolBlockType,
    label: string,
    event: ReactPointerEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setActiveDrag({
      kind: "new-block",
      blockType,
      label,
      x: event.clientX,
      y: event.clientY,
    });

    setActiveCanvasPoint(getCanvasPoint(event.clientX, event.clientY));
  };

  const startExistingBlockDrag = (
    blockIndex: number,
    label: string,
    blockType: CustomToolBlockType,
    event: ReactPointerEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setActiveDrag({
      kind: "existing-block",
      blockIndex,
      blockType,
      label,
      x: event.clientX,
      y: event.clientY,
    });

    setActiveCanvasPoint(getCanvasPoint(event.clientX, event.clientY));
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      setActiveCanvasPoint(getCanvasPoint(event.clientX, event.clientY));

      setActiveDrag((currentDrag) => {
        if (!currentDrag) return currentDrag;

        return {
          ...currentDrag,
          x: event.clientX,
          y: event.clientY,
        };
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = activeDragRef.current;
      const point = getCanvasPoint(event.clientX, event.clientY);

      if (drag && point) {
        if (drag.kind === "new-block") {
          addBlockRef.current(drag.blockType, point);
        } else {
          moveBlockRef.current(drag.blockIndex, point);
        }
      }

      setActiveDrag(null);
      setActiveCanvasPoint(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  return {
    activeCanvasPoint,
    activeDrag,
    canvasRef,
    isDragging,
    startNewBlockDrag,
    startExistingBlockDrag,
  };
}
