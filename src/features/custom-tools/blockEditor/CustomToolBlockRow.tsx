import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  CustomToolBlock,
  CustomToolBlockType,
} from "../model/customToolTypes";
import { BlockConfigEditor } from "./BlockConfigEditor";
import { defaultBlockConfigByType } from "./blockConfigPresets";
import { blockTypeOptions, getBlockTypeLabel } from "./blockTypeOptions";

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

export function CustomToolBlockRow({
  block,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: CustomToolBlockRowProps) {
  const updateType = (type: CustomToolBlockType) => {
    onChange({
      ...block,
      type,
      label: getBlockTypeLabel(type),
      config: { ...defaultBlockConfigByType[type] },
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Block #{index + 1}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {block.type}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move block up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move block down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onRemove}
            aria-label="Remove block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Label</span>
          <Input
            value={block.label}
            onChange={(event) =>
              onChange({ ...block, label: event.target.value })
            }
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Type</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={block.type}
            onChange={(event) =>
              updateType(event.target.value as CustomToolBlockType)
            }
          >
            {blockTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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