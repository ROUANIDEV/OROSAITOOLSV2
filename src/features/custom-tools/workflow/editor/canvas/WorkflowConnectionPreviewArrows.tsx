import type { CustomToolBlock } from "../../../model/customToolTypes";

import {
  getInputPortAnchor,
  getOutputPortAnchor,
} from "../../model/workflowBlockPorts";
import type { WorkflowBlockLayout } from "../../graph/workflowCanvasLayout";
import type { WorkflowConnection } from "../../graph/workflowConnections";

type WorkflowConnectionPreviewArrowsProps = {
  blocks: CustomToolBlock[];
  connections: WorkflowConnection[];
  originalLayouts: Map<string, WorkflowBlockLayout>;
  previewLayouts: Map<string, WorkflowBlockLayout>;
  movedBlockIds: Set<string>;
  width: number;
  height: number;
};

function createPreviewConnectionPath(
  fromBlock: CustomToolBlock,
  toBlock: CustomToolBlock,
  from: WorkflowBlockLayout,
  to: WorkflowBlockLayout,
  connection: WorkflowConnection,
) {
  const start = getOutputPortAnchor(fromBlock, from, connection.fromPortId);
  const end = getInputPortAnchor(toBlock, to, connection.toPortId);

  if (connection.style === "solid") {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (end.side === "top") {
    const middleY = Math.min(start.y, end.y) - 140;

    return `M ${start.x} ${start.y} C ${start.x + 120} ${start.y}, ${
      end.x
    } ${middleY}, ${end.x} ${end.y}`;
  }

  if (end.side === "bottom") {
    const middleY = Math.max(start.y, end.y) + 140;

    return `M ${start.x} ${start.y} C ${start.x + 120} ${start.y}, ${
      end.x
    } ${middleY}, ${end.x} ${end.y}`;
  }

  const curve = Math.max(120, Math.abs(end.x - start.x) / 2);

  return `M ${start.x} ${start.y} C ${start.x + curve} ${start.y}, ${
    end.x - curve
  } ${end.y}, ${end.x} ${end.y}`;
}

export function WorkflowConnectionPreviewArrows({
  blocks,
  connections,
  originalLayouts,
  previewLayouts,
  movedBlockIds,
  width,
  height,
}: WorkflowConnectionPreviewArrowsProps) {
  if (movedBlockIds.size === 0) return null;

  const blockById = new Map(blocks.map((block) => [block.id, block]));

  const relatedConnections = connections.filter((connection) => {
    return (
      movedBlockIds.has(connection.fromBlockId) ||
      movedBlockIds.has(connection.toBlockId)
    );
  });

  if (relatedConnections.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-82 overflow-visible"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="workflow-preview-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" className="fill-primary/70" />
        </marker>
      </defs>

      {relatedConnections.map((connection) => {
        const fromBlock = blockById.get(connection.fromBlockId);
        const toBlock = blockById.get(connection.toBlockId);

        const from =
          previewLayouts.get(connection.fromBlockId) ??
          originalLayouts.get(connection.fromBlockId);

        const to =
          previewLayouts.get(connection.toBlockId) ??
          originalLayouts.get(connection.toBlockId);

        if (!fromBlock || !toBlock || !from || !to) return null;

        return (
          <path
            key={`preview-${connection.id}`}
            d={createPreviewConnectionPath(
              fromBlock,
              toBlock,
              from,
              to,
              connection,
            )}
            className="fill-none stroke-primary/70"
            strokeWidth="3"
            strokeDasharray={connection.style === "dashed" ? "7 7" : "5 5"}
            markerEnd="url(#workflow-preview-arrowhead)"
          />
        );
      })}
    </svg>
  );
}