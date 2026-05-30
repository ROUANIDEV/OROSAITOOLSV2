import type {
  CustomToolBlock,
  CustomToolInput,
} from "../../../domain/customToolTypes";
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
      className="pointer-events-none fixed z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border bg-popover/95 p-4 text-popover-foreground shadow-2xl backdrop-blur"
      style={{
        left: Math.min(position.x + 18, window.innerWidth - 340),
        top: Math.min(position.y + 18, window.innerHeight - 360),
      }}
    >
      <div>
        <p className="text-sm font-semibold">{block.label}</p>
        <p className="text-xs text-muted-foreground">{block.type}</p>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        <section>
          <p className="font-semibold text-muted-foreground">Inputs</p>
          {inputDetails.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {inputDetails.map((detail) => (
                <li key={detail} className="rounded-lg bg-muted px-2 py-1">
                  {detail}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 rounded-lg bg-muted px-2 py-1 text-muted-foreground">
              No input preview.
            </p>
          )}
        </section>

        <section>
          <p className="font-semibold text-muted-foreground">Output preview</p>
          <p className="mt-1 rounded-lg bg-muted px-2 py-1 text-muted-foreground">
            {outputPreview}
          </p>
        </section>
      </div>
    </div>
  );
}
