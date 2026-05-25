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
  CustomToolInput,
  CustomToolManifest,
} from "../model/customToolTypes";
import { createCustomToolInput } from "./createCustomToolInput";
import { CustomToolInputRow } from "./CustomToolInputRow";

type CustomToolInputsEditorProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

function replaceInputReference(value: unknown, oldId: string, nextId: string): unknown {
  if (typeof value === "string") {
    return value === oldId ? nextId : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceInputReference(item, oldId, nextId));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceInputReference(item, oldId, nextId),
      ]),
    );
  }

  return value;
}

function syncBlockReferences(
  blocks: CustomToolBlock[],
  oldInputId: string,
  nextInputId: string,
) {
  if (oldInputId === nextInputId) {
    return blocks;
  }

  return blocks.map((block) => ({
    ...block,
    config: replaceInputReference(
      block.config,
      oldInputId,
      nextInputId,
    ) as Record<string, unknown>,
  }));
}

function touchDraft(
  draft: CustomToolManifest,
  inputs: CustomToolInput[],
  blocks: CustomToolBlock[] = draft.workflow.blocks,
) {
  return {
    ...draft,
    updatedAt: new Date().toISOString(),
    inputs,
    workflow: {
      ...draft.workflow,
      blocks,
    },
  };
}

export function CustomToolInputsEditor({
  draft,
  onDraftChange,
}: CustomToolInputsEditorProps) {
  const addInput = () => {
    onDraftChange(touchDraft(draft, [...draft.inputs, createCustomToolInput()]));
  };

  const updateInput = (inputIndex: number, input: CustomToolInput) => {
    const oldInput = draft.inputs[inputIndex];

    if (!oldInput) {
      return;
    }

    const inputs = draft.inputs.map((currentInput, index) =>
      index === inputIndex ? input : currentInput,
    );

    const blocks = syncBlockReferences(
      draft.workflow.blocks,
      oldInput.id,
      input.id,
    );

    onDraftChange(touchDraft(draft, inputs, blocks));
  };

  const removeInput = (inputIndex: number) => {
    const inputs = draft.inputs.filter((_, index) => index !== inputIndex);

    onDraftChange(touchDraft(draft, inputs));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Tool inputs</CardTitle>
            <CardDescription>
              Define the fields the user fills before running this tool.
            </CardDescription>
          </div>

          <Button size="sm" onClick={addInput}>
            <PlusCircle className="size-4" />
            Add input
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {draft.inputs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No inputs yet. Add a text, file, folder, number, or boolean input.
          </p>
        ) : (
          draft.inputs.map((input, index) => (
            <CustomToolInputRow
              key={input.id}
              input={input}
              onChange={(nextInput) => updateInput(index, nextInput)}
              onRemove={() => removeInput(index)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}