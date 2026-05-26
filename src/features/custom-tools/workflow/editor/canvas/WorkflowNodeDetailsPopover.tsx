import type {
  CustomToolBlock,
  CustomToolInput,
} from "../../../model/customToolTypes";

import {
  getBlockInputDetails,
  getBlockOutputPreview,
} from "../../model/workflowBlockMetadata";

type WorkflowNodeDetailsPopoverProps = {
  block: CustomToolBlock | null;
  inputs: CustomToolInput[];
  position: { x: number; y: number } | null;
};

export function WorkflowNodeDetailsPopover({
  block,
  inputs,
  position,
}: WorkflowNodeDetailsPopoverProps) {
  if (!block || !position) return null;

  const inputDetails = getBlockInputDetails(block, inputs);
  const outputPreview = getBlockOutputPreview(block);

  return (
    <div
      className="pointer-events-none fixed z-200 w-80 rounded-2xl border bg-popover/85 p-4 text-xs shadow-2xl backdrop-blur-md"
      style={{
        left: Math.min(position.x + 18, window.innerWidth - 340),
        top: Math.min(position.y + 18, window.innerHeight - 260),
      }}
    >
      <div className="mb-3">
        <p className="text-sm font-semibold">{block.label}</p>

        <p className="font-mono text-[11px] text-muted-foreground">
          {block.type}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 font-medium">Inputs</p>

          {inputDetails.length > 0 ? (
            inputDetails.map((detail) => (
              <p key={detail} className="text-muted-foreground">
                {detail}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">No input preview.</p>
          )}
        </div>

        <div>
          <p className="mb-1 font-medium">Output preview</p>

          <p className="rounded-md bg-muted/80 px-2 py-1 font-mono text-muted-foreground">
            {outputPreview}
          </p>
        </div>
      </div>
    </div>
  );
}