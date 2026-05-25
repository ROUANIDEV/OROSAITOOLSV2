import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  CustomToolBlock,
  CustomToolBlockType,
  CustomToolManifest,
} from "../model/customToolTypes";
import { BuiltInBlockPalette } from "./BuiltInBlockPalette";
import { createCustomToolBlock } from "./createCustomToolBlock";
import { WorkflowBlockSettingsDialog } from "./WorkflowBlockSettingsDialog";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { WorkflowDeleteBlockDialog } from "./WorkflowDeleteBlockDialog";
import { WorkflowDeleteSelectedBlocksDialog } from "./WorkflowDeleteSelectedBlocksDialog";
import { WorkflowDragGhost } from "./WorkflowDragGhost";
import {
  getBlockLayout,
  withBlockLayout,
  type WorkflowBlockLayout,
} from "./workflowCanvasLayout";
import {
  DEFAULT_WORKFLOW_CANVAS_VIEWPORT,
  type WorkflowCanvasViewport,
} from "./workflowCanvasViewport";
import {
  addWorkflowConnection,
  getWorkflowConnections,
  updateConnectionEndpoint,
  updateConnectionStyle,
  withWorkflowConnections,
  type WorkflowConnection,
  type WorkflowConnectionStyle,
  type WorkflowWithVisualConnections,
} from "./workflowConnections";
import { useWorkflowPointerDrag } from "./useWorkflowPointerDrag";

type CustomToolWorkflowEditorProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

type WorkflowSnapshot = CustomToolManifest["workflow"];

function moveBlock(blocks: CustomToolBlock[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) {
    return blocks;
  }

  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(from, 1);
  nextBlocks.splice(to, 0, movedBlock);

  return nextBlocks;
}

function withBlocksAndConnections(
  draft: CustomToolManifest,
  blocks: CustomToolBlock[],
  connections: WorkflowConnection[],
): CustomToolManifest {
  return {
    ...draft,
    workflow: {
      ...draft.workflow,
      blocks,
      visualConnections: connections,
    } as WorkflowWithVisualConnections,
  };
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

export function CustomToolWorkflowEditor({
  draft,
  onDraftChange,
}: CustomToolWorkflowEditorProps) {
  const blocks = draft.workflow.blocks;
  const connections = getWorkflowConnections(draft);
  const [paletteCollapsed, setPaletteCollapsed] = useState(true);
  const [viewport, setViewport] = useState<WorkflowCanvasViewport>(
    DEFAULT_WORKFLOW_CANVAS_VIEWPORT,
  );
  const [pastWorkflows, setPastWorkflows] = useState<WorkflowSnapshot[]>([]);
  const [futureWorkflows, setFutureWorkflows] = useState<WorkflowSnapshot[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const selectedBlockNames = blocks
    .filter((block) => selectedBlockIds.includes(block.id))
    .map((block) => block.label);

  const commitWorkflow = (workflow: WorkflowSnapshot) => {
    setPastWorkflows((currentPast) => {
      return [...currentPast.slice(-39), draft.workflow];
    });
    setFutureWorkflows([]);
    onDraftChange({
      ...draft,
      workflow,
    });
  };

  const updateBlocks = (nextBlocks: CustomToolBlock[]) => {
    commitWorkflow({
      ...draft.workflow,
      blocks: nextBlocks,
    });
  };

  const updateConnections = (nextConnections: WorkflowConnection[]) => {
    commitWorkflow({
      ...draft.workflow,
      visualConnections: nextConnections,
    } as WorkflowWithVisualConnections);
  };

  const undoWorkflow = () => {
    const previousWorkflow = pastWorkflows[pastWorkflows.length - 1];
    if (!previousWorkflow) return;

    setPastWorkflows((currentPast) => currentPast.slice(0, -1));
    setFutureWorkflows((currentFuture) => [draft.workflow, ...currentFuture]);
    onDraftChange({
      ...draft,
      workflow: previousWorkflow,
    });
  };

  const redoWorkflow = () => {
    const nextWorkflow = futureWorkflows[0];
    if (!nextWorkflow) return;

    setFutureWorkflows((currentFuture) => currentFuture.slice(1));
    setPastWorkflows((currentPast) => [...currentPast, draft.workflow]);
    onDraftChange({
      ...draft,
      workflow: nextWorkflow,
    });
  };

  const deleteSelectedBlocks = () => {
    if (selectedBlockIds.length === 0) return;

    const selectedIds = new Set(selectedBlockIds);
    const nextBlocks = blocks.filter((block) => !selectedIds.has(block.id));

    // Only remove connections that are directly related to deleted blocks.
    // Connections between remaining blocks are preserved.
    const nextConnections = connections.filter((connection) => {
      return (
        !selectedIds.has(connection.fromBlockId) &&
        !selectedIds.has(connection.toBlockId)
      );
    });

    commitWorkflow(
      withBlocksAndConnections(draft, nextBlocks, nextConnections).workflow,
    );
    setSelectedBlockId(null);
    setSelectedBlockIds([]);
    setSelectedConnectionId(null);
    setDeleteSelectedOpen(false);
  };

  const requestDeleteSelectedBlocks = () => {
    if (selectedBlockIds.length === 0) return;
    setDeleteSelectedOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) return;

      const usesModifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (usesModifier && key === "z" && event.shiftKey) {
        event.preventDefault();
        redoWorkflow();
        return;
      }

      if (usesModifier && key === "z") {
        event.preventDefault();
        undoWorkflow();
        return;
      }

      if (usesModifier && key === "y") {
        event.preventDefault();
        redoWorkflow();
        return;
      }

      if (key === "delete" || key === "backspace") {
        if (selectedBlockIds.length > 0) {
          event.preventDefault();
          requestDeleteSelectedBlocks();
        }
      }

      if (key === "escape" && deleteSelectedOpen) {
        event.preventDefault();
        setDeleteSelectedOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    deleteSelectedOpen,
    draft,
    futureWorkflows,
    pastWorkflows,
    selectedBlockIds,
  ]);

  const addBlockAtPoint = (
    type: CustomToolBlockType,
    point: { x: number; y: number },
  ) => {
    const block = createCustomToolBlock(type);

    updateBlocks([
      ...blocks,
      withBlockLayout(block, {
        x: point.x - 150,
        y: point.y - 75,
      }),
    ]);
    setSelectedBlockIds([block.id]);
    setSelectedBlockId(block.id);
  };

  const addBlockFromButton = (type: CustomToolBlockType) => {
    const block = createCustomToolBlock(type);

    updateBlocks([
      ...blocks,
      withBlockLayout(block, getBlockLayout(block, blocks.length)),
    ]);
    setSelectedBlockIds([block.id]);
    setSelectedBlockId(block.id);
  };

  const moveBlockToPoint = (
    fromIndex: number,
    point: { x: number; y: number },
  ) => {
    const block = blocks[fromIndex];
    if (!block) return;

    const draggedLayout = getBlockLayout(block, fromIndex);
    const nextDraggedX = point.x - draggedLayout.width / 2;
    const nextDraggedY = point.y - draggedLayout.height / 2;
    const deltaX = nextDraggedX - draggedLayout.x;
    const deltaY = nextDraggedY - draggedLayout.y;

    const selectedIds =
      selectedBlockIds.includes(block.id) && selectedBlockIds.length > 1
        ? new Set(selectedBlockIds)
        : new Set([block.id]);

    updateBlocks(
      blocks.map((currentBlock, index) => {
        if (!selectedIds.has(currentBlock.id)) return currentBlock;

        const currentLayout = getBlockLayout(currentBlock, index);

        return withBlockLayout(currentBlock, {
          x: currentLayout.x + deltaX,
          y: currentLayout.y + deltaY,
        });
      }),
    );
  };

  const updateBlockLayout = (
    blockId: string,
    layout: Partial<WorkflowBlockLayout>,
  ) => {
    updateBlocks(
      blocks.map((block, index) => {
        if (block.id !== blockId) return block;
        return withBlockLayout(block, layout, index);
      }),
    );
  };

  const removeBlock = (blockId: string) => {
    const nextBlocks = blocks.filter((block) => block.id !== blockId);

    // Only remove connections attached to this deleted block.
    const nextConnections = connections.filter((connection) => {
      return (
        connection.fromBlockId !== blockId && connection.toBlockId !== blockId
      );
    });

    commitWorkflow(
      withBlocksAndConnections(draft, nextBlocks, nextConnections).workflow,
    );
    setDeleteBlockId(null);
    setSelectedConnectionId(null);
    setSelectedBlockIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== blockId),
    );

    if (selectedBlockId === blockId) setSelectedBlockId(null);
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  const {
    activeCanvasPoint,
    activeDrag,
    canvasRef,
    isDragging,
    startNewBlockDrag,
    startExistingBlockDrag,
  } = useWorkflowPointerDrag({
    viewport,
    onAddBlockAtPoint: addBlockAtPoint,
    onMoveBlockToPoint: moveBlockToPoint,
  });

  const editingBlock =
    blocks.find((block) => block.id === editingBlockId) ?? null;
  const editingIndex = editingBlock
    ? blocks.findIndex((block) => block.id === editingBlock.id)
    : -1;
  const deleteBlock = blocks.find((block) => block.id === deleteBlockId) ?? null;

  const changeConnectionStyle = (
    connectionId: string,
    style: WorkflowConnectionStyle,
  ) => {
    updateConnections(updateConnectionStyle(connections, connectionId, style));
  };

  const changeConnectionEndpoint = (
    connectionId: string,
    endpoint: "from" | "to",
    blockId: string,
  ) => {
    updateConnections(
      updateConnectionEndpoint(connections, connectionId, endpoint, blockId),
    );
  };

  const addConnection = (
    fromBlockId: string,
    toBlockId: string,
    fromPortId?: string,
    toPortId?: string,
  ) => {
    updateConnections(
      addWorkflowConnection(
        connections,
        fromBlockId,
        toBlockId,
        fromPortId,
        toPortId,
      ),
    );
  };

  const selectSingleBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setSelectedBlockIds([blockId]);
  };

  const selectBlocks = (blockIds: string[]) => {
    setSelectedBlockIds(blockIds);
    setSelectedBlockId(blockIds[0] ?? null);
    setSelectedConnectionId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual workflow builder</CardTitle>
        <CardDescription>
          Use an unbounded canvas with area selection, group movement, preview
          arrows, and confirmed group deletion.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div
          className={
            paletteCollapsed
              ? "grid items-stretch gap-5 xl:grid-cols-[8rem_minmax(0,1fr)]"
              : "grid items-stretch gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]"
          }
        >
          <BuiltInBlockPalette
            collapsed={paletteCollapsed}
            onCollapsedChange={setPaletteCollapsed}
            onAddBlock={addBlockFromButton}
            onStartDrag={startNewBlockDrag}
          />

          <WorkflowCanvas
            canvasRef={canvasRef}
            blocks={blocks}
            inputs={draft.inputs}
            connections={connections}
            selectedBlockId={selectedBlockId}
            selectedBlockIds={selectedBlockIds}
            selectedConnectionId={selectedConnectionId}
            activeDrag={activeDrag}
            activeCanvasPoint={activeCanvasPoint}
            isDragging={isDragging}
            viewport={viewport}
            canUndo={pastWorkflows.length > 0}
            canRedo={futureWorkflows.length > 0}
            canDeleteSelection={selectedBlockIds.length > 0}
            onUndo={undoWorkflow}
            onRedo={redoWorkflow}
            onRequestDeleteSelection={requestDeleteSelectedBlocks}
            onViewportChange={setViewport}
            onSelectBlock={selectSingleBlock}
            onSelectBlocks={selectBlocks}
            onSelectConnection={setSelectedConnectionId}
            onAddConnection={addConnection}
            onDeleteConnection={(connectionId) => {
              updateConnections(
                connections.filter((connection) => {
                  return connection.id !== connectionId;
                }),
              );
              setSelectedConnectionId(null);
            }}
            onConnectionStyleChange={changeConnectionStyle}
            onConnectionEndpointChange={changeConnectionEndpoint}
            onEditBlock={setEditingBlockId}
            onDeleteBlock={setDeleteBlockId}
            onBlockLayoutChange={updateBlockLayout}
            onStartBlockDrag={(index, event) => {
              startExistingBlockDrag(
                index,
                blocks[index].label,
                blocks[index].type,
                event,
              );
            }}
          />
        </div>

        <WorkflowBlockSettingsDialog
          block={editingBlock}
          index={editingIndex}
          canMoveUp={editingIndex > 0}
          canMoveDown={editingIndex >= 0 && editingIndex < blocks.length - 1}
          onClose={() => setEditingBlockId(null)}
          onChange={(nextBlock) => {
            updateBlocks(
              blocks.map((block) =>
                block.id === nextBlock.id ? nextBlock : block,
              ),
            );
          }}
          onMoveUp={() =>
            updateBlocks(moveBlock(blocks, editingIndex, editingIndex - 1))
          }
          onMoveDown={() =>
            updateBlocks(moveBlock(blocks, editingIndex, editingIndex + 1))
          }
          onRemove={() => {
            if (editingBlock) removeBlock(editingBlock.id);
          }}
        />

        <WorkflowDeleteBlockDialog
          block={deleteBlock}
          onCancel={() => setDeleteBlockId(null)}
          onConfirm={() => {
            if (deleteBlock) removeBlock(deleteBlock.id);
          }}
        />

        <WorkflowDeleteSelectedBlocksDialog
          open={deleteSelectedOpen}
          selectedBlockNames={selectedBlockNames}
          onCancel={() => setDeleteSelectedOpen(false)}
          onConfirm={deleteSelectedBlocks}
        />

        <WorkflowDragGhost activeDrag={activeDrag} />
      </CardContent>
    </Card>
  );
}
