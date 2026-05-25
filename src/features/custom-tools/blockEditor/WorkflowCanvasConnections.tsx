import type { CustomToolBlock } from "../model/customToolTypes";
import {
  getInputPortAnchor,
  getOutputPortAnchor,
} from "./workflowBlockPorts";
import type { WorkflowBlockLayout } from "./workflowCanvasLayout";
import type { WorkflowConnection } from "./workflowConnections";
import type { WorkflowCanvasPoint } from "./workflowPointerDragTypes";

type DraftConnection = {
  fromBlockId: string;
  fromPortId: string;
  toPoint: WorkflowCanvasPoint;
};

type WorkflowCanvasConnectionsProps = {
  blocks: CustomToolBlock[];
  connections: WorkflowConnection[];
  draftConnection: DraftConnection | null;
  layouts: Map<string, WorkflowBlockLayout>;
  selectedConnectionId: string | null;
  width: number;
  height: number;
  onSelectConnection: (connectionId: string) => void;
};

function createConnectionPath(
  fromBlock: CustomToolBlock,
  toBlock: CustomToolBlock,
  from: WorkflowBlockLayout,
  to: WorkflowBlockLayout,
  connection: WorkflowConnection,
  curved: boolean,
) {
  const start = getOutputPortAnchor(fromBlock, from, connection.fromPortId);
  const end = getInputPortAnchor(toBlock, to, connection.toPortId);

  if (!curved) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

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

function createDraftConnectionPath(
  fromBlock: CustomToolBlock,
  fromLayout: WorkflowBlockLayout,
  fromPortId: string,
  toPoint: WorkflowCanvasPoint,
) {
  const start = getOutputPortAnchor(fromBlock, fromLayout, fromPortId);
  const curve = Math.max(120, Math.abs(toPoint.x - start.x) / 2);

  return `M ${start.x} ${start.y} C ${start.x + curve} ${start.y}, ${
    toPoint.x - curve
  } ${toPoint.y}, ${toPoint.x} ${toPoint.y}`;
}

export function WorkflowCanvasConnections({
  blocks,
  connections,
  draftConnection,
  layouts,
  selectedConnectionId,
  width,
  height,
  onSelectConnection,
}: WorkflowCanvasConnectionsProps) {
  const blockById = new Map(blocks.map((block) => [block.id, block]));

  return (
    <svg
      className="absolute left-0 top-0 z-20 overflow-visible"
      width={width}
      height={height}
      style={{
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <defs>
        <marker
          id="workflow-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" className="fill-muted-foreground" />
        </marker>
      </defs>

      {connections.map((connection) => {
        const from = layouts.get(connection.fromBlockId);
        const to = layouts.get(connection.toBlockId);
        const fromBlock = blockById.get(connection.fromBlockId);
        const toBlock = blockById.get(connection.toBlockId);
        if (!from || !to || !fromBlock || !toBlock) return null;

        const path = createConnectionPath(
          fromBlock,
          toBlock,
          from,
          to,
          connection,
          connection.style === "curved",
        );
        const selected = selectedConnectionId === connection.id;

        return (
          <g key={connection.id}>
            <path
              d={path}
              className={
                selected
                  ? "fill-none stroke-primary"
                  : "fill-none stroke-muted-foreground/50"
              }
              strokeWidth={selected ? 3 : 2}
              strokeDasharray={
                connection.style === "dashed" ? "7 7" : undefined
              }
              markerEnd="url(#workflow-arrowhead)"
            />

            <path
              d={path}
              className="cursor-pointer fill-none stroke-transparent"
              data-no-pan="true"
              strokeWidth="18"
              style={{ pointerEvents: "stroke" }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelectConnection(connection.id);
              }}
            />
          </g>
        );
      })}

      {draftConnection ? (
        <path
          d={(() => {
            const from = layouts.get(draftConnection.fromBlockId);
            const fromBlock = blockById.get(draftConnection.fromBlockId);
            return from && fromBlock
              ? createDraftConnectionPath(
                  fromBlock,
                  from,
                  draftConnection.fromPortId,
                  draftConnection.toPoint,
                )
              : "";
          })()}
          className="pointer-events-none fill-none stroke-primary"
          strokeDasharray="8 8"
          strokeWidth="3"
          markerEnd="url(#workflow-arrowhead)"
        />
      ) : null}
    </svg>
  );
}
