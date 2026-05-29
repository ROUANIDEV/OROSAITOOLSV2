import { ArrowDown, ArrowUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
  type CustomToolBlockType,
} from "../../../domain/customToolTypes";
import { createBlockConfigPreset } from "../../model/blockConfigPresets";
import {
  customToolBlockTypeOptions,
  getBlockTypeLabel,
} from "../../model/blockTypeOptions";
import { BlockConfigEditor } from "./BlockConfigEditor";

type CustomToolBlockRowProps = {
  block: CustomToolBlock;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (block: CustomToolBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

function getExecutionModeLabel(block: CustomToolBlock) {
  if (block.executionMode) return block.executionMode;

  return isFoundationCustomToolBlockType(block.type) ? "model" : "runtime";
}

export function CustomToolBlockRow({
  block,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onMoveUp,
  onMoveDown,
}: CustomToolBlockRowProps) {
  const executionMode = getExecutionModeLabel(block);

  const updateType = (type: CustomToolBlockType) => {
    onChange({
      ...block,
      type,
      label: getBlockTypeLabel(type),
      executionMode: isFoundationCustomToolBlockType(type) ? "model" : "runtime",
      config: createBlockConfigPreset(type),
    });
  };

  return (
    <div className="space-y-4 rounded-xl border bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">Block #{index + 1}</p>
            <Badge
              variant={executionMode === "model" ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {executionMode}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">{block.type}</p>
        </div>

        <div className="flex items-center gap-2">
          <p className="hidden max-w-xs text-right text-xs text-muted-foreground sm:block">
            Reorder sequence here. Delete from the canvas.
          </p>

          <div className="flex items-center gap-1 rounded-lg border bg-background/70 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label="Move block up"
              title="Move block up"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label="Move block down"
              title="Move block down"
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${block.id}-label`}>Label</Label>
          <Input
            id={`${block.id}-label`}
            value={block.label}
            onChange={(event) => onChange({ ...block, label: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${block.id}-type`}>Type</Label>
          <select
            id={`${block.id}-type`}
            value={block.type}
            onChange={(event) => updateType(event.target.value as CustomToolBlockType)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {customToolBlockTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.executionMode === "model" ? " · model" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${block.id}-description`}>Description</Label>
        <Input
          id={`${block.id}-description`}
          value={block.description}
          onChange={(event) =>
            onChange({ ...block, description: event.target.value })
          }
        />
      </div>

      <BlockConfigEditor
        blockId={block.id}
        blockType={block.type}
        config={block.config}
        onConfigChange={(config) => onChange({ ...block, config })}
      />
    </div>
  );
}
