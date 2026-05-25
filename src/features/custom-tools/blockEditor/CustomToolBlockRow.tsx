import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  CustomToolBlock,
  CustomToolBlockType,
} from "../model/customToolTypes";
import { defaultBlockConfigByType } from "./blockConfigPresets";
import { blockTypeOptions, getBlockTypeLabel } from "./blockTypeOptions";
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
      config: defaultBlockConfigByType[type],
    });
  };

  return (
    <div className="grid gap-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Block #{index + 1}</p>
          <p className="text-xs text-muted-foreground">{block.type}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${block.id}-label`}>Label</Label>
          <Input
            id={`${block.id}-label`}
            value={block.label}
            onChange={(event) =>
              onChange({ ...block, label: event.target.value })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${block.id}-type`}>Type</Label>
          <select
            id={`${block.id}-type`}
            className="h-9 rounded-md border bg-background px-3 text-sm"
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
        </div>
      </div>

      <div className="grid gap-2">
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
        config={block.config}
        onConfigChange={(config) => onChange({ ...block, config })}
      />
    </div>
  );
}