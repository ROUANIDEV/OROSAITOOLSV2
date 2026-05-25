import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  CustomToolBlock,
  CustomToolManifest,
} from "../model/customToolTypes";
import { createCustomToolBlock } from "./createCustomToolBlock";
import { CustomToolBlockRow } from "./CustomToolBlockRow";

type CustomToolWorkflowEditorProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

function touchDraft(draft: CustomToolManifest, blocks: CustomToolBlock[]) {
  return {
    ...draft,
    updatedAt: new Date().toISOString(),
    workflow: {
      ...draft.workflow,
      blocks,
    },
  };
}

function moveBlock(blocks: CustomToolBlock[], from: number, to: number) {
  const nextBlocks = [...blocks];
  const [block] = nextBlocks.splice(from, 1);

  if (!block) {
    return blocks;
  }

  nextBlocks.splice(to, 0, block);
  return nextBlocks;
}

export function CustomToolWorkflowEditor({
  draft,
  onDraftChange,
}: CustomToolWorkflowEditorProps) {
  const blocks = draft.workflow.blocks;

  const updateBlocks = (nextBlocks: CustomToolBlock[]) => {
    onDraftChange(touchDraft(draft, nextBlocks));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Workflow blocks</CardTitle>
            <CardDescription>
              Build the ordered automation steps for this custom tool.
            </CardDescription>
          </div>

          <Button size="sm" onClick={() => updateBlocks([...blocks, createCustomToolBlock()])}>
            <PlusCircle className="size-4" />
            Add block
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No blocks yet. Add a block to start building the workflow.
          </p>
        ) : (
          blocks.map((block, index) => (
            <CustomToolBlockRow
              key={block.id}
              block={block}
              index={index}
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
              onChange={(nextBlock) => {
                updateBlocks(
                  blocks.map((currentBlock) =>
                    currentBlock.id === block.id ? nextBlock : currentBlock,
                  ),
                );
              }}
              onMoveUp={() => updateBlocks(moveBlock(blocks, index, index - 1))}
              onMoveDown={() => updateBlocks(moveBlock(blocks, index, index + 1))}
              onRemove={() =>
                updateBlocks(blocks.filter((item) => item.id !== block.id))
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}