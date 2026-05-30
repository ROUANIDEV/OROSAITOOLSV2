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
import type { FoundationArrowInputSuggestion } from "../../../runtime/foundationWorkflowRuntime";
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
  workflowBlocks?: CustomToolBlock[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
  onChange: (block: CustomToolBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

function getExecutionModeLabel(block: CustomToolBlock) {
  if (block.executionMode) return block.executionMode;
  return isFoundationCustomToolBlockType(block.type) ? "model" : "runtime";
}

function getNameFieldLabel(type: CustomToolBlockType) {
  if (type === "io.input") return "Input name";
  if (type === "io.output") return "Output name";
  return "Block name";
}

function getNameHelp(type: CustomToolBlockType) {
  if (type === "io.input") {
    return "This is the user-facing name shown in Run Rust Workflow and after publishing.";
  }
  if (type === "io.output") {
    return "This is the user-facing result name shown after Run Rust Workflow and after publishing.";
  }
  return "Give this block a simple name so the canvas stays readable.";
}

function mirrorCanvasIoLabel(
  block: CustomToolBlock,
  label: string,
): CustomToolBlock {
  return { ...block, label };
}

export function CustomToolBlockRow({
  block,
  index,
  canMoveUp,
  canMoveDown,
  workflowBlocks = [],
  linkedInputSuggestions = [],
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
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
    <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Block #{index + 1}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{executionMode}</Badge>
            <Badge variant="outline">{block.type}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled={!canMoveUp} onClick={onMoveUp}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={!canMoveDown} onClick={onMoveDown}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="destructive" onClick={onRemove}>Remove</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{getNameFieldLabel(block.type)}</Label>
          <Input
            value={block.label}
            onChange={(event) => onChange(mirrorCanvasIoLabel(block, event.target.value))}
            placeholder={block.type === "io.input" ? "Number input" : undefined}
          />
          <p className="text-xs text-muted-foreground">{getNameHelp(block.type)}</p>
        </div>
        <div className="space-y-2">
          <Label>Block type</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={block.type}
            onChange={(event) => updateType(event.target.value as CustomToolBlockType)}
          >
            {customToolBlockTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.category} · {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BlockConfigEditor
        blockId={block.id}
        blockType={block.type}
        config={block.config}
        workflowBlocks={workflowBlocks}
        linkedInputSuggestions={linkedInputSuggestions}
        onConfigChange={(config) => onChange({ ...block, config })}
      />
    </div>
  );
}
