import type { CustomToolBlock } from "../../../domain/customToolTypes";
import type { WorkflowBlockLayout } from "../../graph/workflowCanvasLayout";
import type { WorkflowConnection } from "../../graph/workflowConnections";
import type { WorkflowCanvasPoint } from "../../graph/workflowPointerDragTypes";
import {
  getInputPortAnchor,
  getOutputPortAnchor,
} from "../../model/workflowBlockPorts";

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

function createConnectionPathFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number; side?: string },
  curved: boolean,
) {
  if (!curved) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

  if (end.side === "top") {
    const middleY = Math.min(start.y, end.y) - 140;
    return `M ${start.x} ${start.y} C ${start.x + 120} ${start.y}, ${end.x} ${middleY}, ${end.x} ${end.y}`;
  }

  if (end.side === "bottom") {
    const middleY = Math.max(start.y, end.y) + 140;
    return `M ${start.x} ${start.y} C ${start.x + 120} ${start.y}, ${end.x} ${middleY}, ${end.x} ${end.y}`;
  }

  const curve = Math.max(120, Math.abs(end.x - start.x) / 2);
  return `M ${start.x} ${start.y} C ${start.x + curve} ${start.y}, ${end.x - curve} ${end.y}, ${end.x} ${end.y}`;
}

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
  return createConnectionPathFromPoints(start, end, curved);
}

function createDraftConnectionPath(
  fromBlock: CustomToolBlock,
  fromLayout: WorkflowBlockLayout,
  fromPortId: string,
  toPoint: WorkflowCanvasPoint,
) {
  const start = getOutputPortAnchor(fromBlock, fromLayout, fromPortId);
  return createConnectionPathFromPoints(start, toPoint, true);
}

const arrowMarkerId = "workflow-canvas-arrow-head";
const selectedArrowMarkerId = "workflow-canvas-arrow-head-selected";

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
  const blockById = new Map(blocks.map((block) => [block.id, block] as const));

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <marker
          id={arrowMarkerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-muted-foreground/70" />
        </marker>
        <marker
          id={selectedArrowMarkerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-primary" />
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
              fill="none"
              stroke="transparent"
              strokeWidth="22"
              strokeLinecap="round"
              pointerEvents="stroke"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelectConnection(connection.id);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelectConnection(connection.id);
              }}
            />
            <path
              d={path}
              className={[
                "pointer-events-none fill-none transition",
                selected ? "stroke-primary" : "stroke-muted-foreground/70",
              ].join(" ")}
              strokeWidth={selected ? 3.5 : 2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={connection.style === "dashed" ? "9 8" : undefined}
              markerEnd={`url(#${selected ? selectedArrowMarkerId : arrowMarkerId})`}
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
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={`url(#${selectedArrowMarkerId})`}
        />
      ) : null}
    </svg>
  );
}
