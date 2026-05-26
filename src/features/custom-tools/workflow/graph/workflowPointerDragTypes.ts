import type { CustomToolBlockType } from "../../domain/customToolTypes";

export type WorkflowCanvasPoint = {
  x: number;
  y: number;
};

export type ActiveWorkflowPointerDrag =
  | {
      kind: "new-block";
      blockType: CustomToolBlockType;
      label: string;
      x: number;
      y: number;
    }
  | {
      kind: "existing-block";
      blockIndex: number;
      blockType: CustomToolBlockType;
      label: string;
      x: number;
      y: number;
    };