import { useEffect, useState, type SetStateAction } from "react";

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
} from "../../model/customToolTypes";

import { BuiltInBlockPalette } from "./components/BuiltInBlockPalette";
import { createCustomToolBlock } from "../model/createCustomToolBlock";
import { WorkflowBlockSettingsDialog } from "./dialogs/WorkflowBlockSettingsDialog";
import { WorkflowCanvas } from "./canvas/WorkflowCanvas";
import { WorkflowDeleteBlockDialog } from "./dialogs/WorkflowDeleteBlockDialog";
import { WorkflowDeleteSelectedBlocksDialog } from "./dialogs/WorkflowDeleteSelectedBlocksDialog";
import { WorkflowDragGhost } from "./canvas/WorkflowDragGhost";

import {
  getBlockLayout,
  withBlockLayout,
  type WorkflowBlockLayout,
} from "../graph/workflowCanvasLayout";

import {
  DEFAULT_WORKFLOW_CANVAS_VIEWPORT,
  type WorkflowCanvasViewport,
} from "../graph/workflowCanvasViewport";

import {
  addWorkflowConnection,
  getWorkflowConnections,
  updateConnectionEndpoint,
  updateConnectionStyle,
  withWorkflowConnections,
  type WorkflowConnection,
  type WorkflowConnectionStyle,
  type WorkflowWithVisualConnections,
} from "../graph/workflowConnections";

import { useWorkflowPointerDrag } from "./hooks/useWorkflowPointerDrag";

type CustomToolWorkflowEditorProps = {
  draft: CustomToolManifest;
  session?: CustomToolWorkflowEditorSession;
  onSessionChange?: (session: CustomToolWorkflowEditorSession) => void;
  onDraftChange: (draft: CustomToolManifest) => void;
};

type WorkflowSnapshot = CustomToolManifest["workflow"];

export type CustomToolWorkflowEditorSession = {
  paletteCollapsed: boolean;
  viewport: WorkflowCanvasViewport;
  pastWorkflows: WorkflowSnapshot[];
  futureWorkflows: WorkflowSnapshot[];
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  selectedConnectionId: string | null;
};

function createDefaultWorkflowEditorSession(): CustomToolWorkflowEditorSession {
  return {
    paletteCollapsed: true,
    viewport: DEFAULT_WORKFLOW_CANVAS_VIEWPORT,
    pastWorkflows: [],
    futureWorkflows: [],
    selectedBlockId: null,
    selectedBlockIds: [],
    selectedConnectionId: null,
  };
}

function normalizeWorkflowEditorSession(
  session?: CustomToolWorkflowEditorSession,
): CustomToolWorkflowEditorSession {
  const defaults = createDefaultWorkflowEditorSession();

  if (!session) return defaults;

  return {
    ...defaults,
    ...session,
    viewport: {
      ...defaults.viewport,
      ...session.viewport,
    },
    pastWorkflows: Array.isArray(session.pastWorkflows)
      ? session.pastWorkflows
      : [],
    futureWorkflows: Array.isArray(session.futureWorkflows)
      ? session.futureWorkflows
      : [],
    selectedBlockIds: Array.isArray(session.selectedBlockIds)
      ? session.selectedBlockIds
      : [],
  };
}

function resolveStateAction<T>(action: SetStateAction<T>, currentValue: T): T {
  if (typeof action === "function") {
    return (action as (value: T) => T)(currentValue);
  }

  return action;
}

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
  session,
  onSessionChange,
  onDraftChange,
}: CustomToolWorkflowEditorProps) {
  const blocks = draft.workflow.blocks;
  const connections = getWorkflowConnections(draft);

  const [localSession, setLocalSession] =
    useState<CustomToolWorkflowEditorSession>(() =>
      createDefaultWorkflowEditorSession(),
    );

  const currentSession = normalizeWorkflowEditorSession(
    session ?? localSession,
  );

  const {
    paletteCollapsed,
    viewport,
    pastWorkflows,
    futureWorkflows,
    selectedBlockId,
    selectedBlockIds,
    selectedConnectionId,
  } = currentSession;

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const commitSession = (
    action: SetStateAction<CustomToolWorkflowEditorSession>,
  ) => {
    const nextSession = resolveStateAction(action, currentSession);

    if (onSessionChange) {
      onSessionChange(nextSession);
      return;
    }

    setLocalSession(nextSession);
  };

  const setSessionField = <Key extends keyof CustomToolWorkflowEditorSession>(
    key: Key,
    action: SetStateAction<CustomToolWorkflowEditorSession[Key]>,
  ) => {
    commitSession((currentValue) => ({
      ...currentValue,
      [key]: resolveStateAction(action, currentValue[key]),
    }));
  };

  const setPaletteCollapsed = (value: SetStateAction<boolean>) => {
    setSessionField("paletteCollapsed", value);
  };

  const setViewport = (value: SetStateAction<WorkflowCanvasViewport>) => {
    setSessionField("viewport", value);
  };

  const setPastWorkflows = (value: SetStateAction<WorkflowSnapshot[]>) => {
    setSessionField("pastWorkflows", value);
  };

  const setFutureWorkflows = (value: SetStateAction<WorkflowSnapshot[]>) => {
    setSessionField("futureWorkflows", value);
  };

  const setSelectedBlockId = (value: SetStateAction<string | null>) => {
    setSessionField("selectedBlockId", value);
  };

  const setSelectedBlockIds = (value: SetStateAction<string[]>) => {
    setSessionField("selectedBlockIds", value);
  };

  const setSelectedConnectionId = (value: SetStateAction<string | null>) => {
    setSessionField("selectedConnectionId", value);
  };

  const selectedBlockNames = blocks
    .filter((block) => selectedBlockIds.includes(block.id))
    .map((block) => block.label);

  const commitWorkflow = (workflow: WorkflowSnapshot) => {
    commitSession((currentValue) => ({
      ...currentValue,
      pastWorkflows: [...currentValue.pastWorkflows.slice(-39), draft.workflow],
      futureWorkflows: [],
    }));

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

    commitSession((currentValue) => ({
      ...currentValue,
      pastWorkflows: currentValue.pastWorkflows.slice(0, -1),
      futureWorkflows: [draft.workflow, ...currentValue.futureWorkflows],
    }));

    onDraftChange({
      ...draft,
      workflow: previousWorkflow,
    });
  };

  const redoWorkflow = () => {
    const nextWorkflow = futureWorkflows[0];

    if (!nextWorkflow) return;

    commitSession((currentValue) => ({
      ...currentValue,
      futureWorkflows: currentValue.futureWorkflows.slice(1),
      pastWorkflows: [...currentValue.pastWorkflows, draft.workflow],
    }));

    onDraftChange({
      ...draft,
      workflow: nextWorkflow,
    });
  };

  const deleteSelectedBlocks = () => {
    if (selectedBlockIds.length === 0) return;

    const selectedIds = new Set(selectedBlockIds);
    const nextBlocks = blocks.filter((block) => !selectedIds.has(block.id));

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

    const nextConnections = connections.filter((connection) => {
      return (
        connection.fromBlockId !== blockId &&
        connection.toBlockId !== blockId
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

  const deleteBlock =
    blocks.find((block) => block.id === deleteBlockId) ?? null;

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
    setSelectedConnectionId(null);
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
          arrows, persistent undo/redo, and confirmed group deletion.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
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
              const block = blocks[index];

              if (!block) return;

              startExistingBlockDrag(index, block.label, block.type, event);
            }}
          />

          <BuiltInBlockPalette
            collapsed={paletteCollapsed}
            onCollapsedChange={setPaletteCollapsed}
            onAddBlock={addBlockFromButton}
            onStartDrag={startNewBlockDrag}
          />
        </div>

        <WorkflowDragGhost activeDrag={activeDrag} />

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
          onMoveUp={() => {
            updateBlocks(moveBlock(blocks, editingIndex, editingIndex - 1));
          }}
          onMoveDown={() => {
            updateBlocks(moveBlock(blocks, editingIndex, editingIndex + 1));
          }}
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
      </CardContent>
    </Card>
  );
}