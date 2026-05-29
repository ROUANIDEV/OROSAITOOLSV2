import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  BooleanConfigField,
  JsonConfigField,
  NumberConfigField,
  StringConfigField,
  TextConfigField,
  type FoundationConfigEditorProps,
  updateFoundationConfig,
} from "./FoundationConfigFields";

type FoundationControlFlowBlockEditorProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

export function FoundationControlFlowBlockEditor({
  blockId,
  blockType,
  config,
  onConfigChange,
}: FoundationControlFlowBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "control.if":
      return (
        <div className="space-y-4">
          <TextConfigField
            id={`${blockId}-condition`}
            label="Condition"
            value={config.condition}
            onChange={(condition) => update({ condition })}
            placeholder="fileCount > 0"
            description="Boolean expression used to route true/false branches."
          />
          <BooleanConfigField
            id={`${blockId}-false-branch-enabled`}
            label="Enable else branch"
            checked={config.falseBranchEnabled}
            onChange={(falseBranchEnabled) => update({ falseBranchEnabled })}
          />
        </div>
      );

    case "control.switch":
      return (
        <div className="space-y-4">
          <TextConfigField
            id={`${blockId}-expression`}
            label="Switch expression"
            value={config.expression}
            onChange={(expression) => update({ expression })}
            placeholder="inputs.action"
          />
          <JsonConfigField
            id={`${blockId}-cases`}
            label="Cases"
            value={config.cases}
            fallbackValue={[]}
            onChange={(cases) => update({ cases })}
            description='Example: [{ "when": "format", "label": "Format files" }]'
          />
          <BooleanConfigField
            id={`${blockId}-default-case-enabled`}
            label="Enable default case"
            checked={config.defaultCaseEnabled}
            onChange={(defaultCaseEnabled) => update({ defaultCaseEnabled })}
          />
        </div>
      );

    case "loop.for":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <StringConfigField
            id={`${blockId}-index-name`}
            label="Index variable"
            value={config.indexName}
            onChange={(indexName) => update({ indexName })}
            placeholder="index"
          />
          <NumberConfigField
            id={`${blockId}-step`}
            label="Step"
            value={config.step}
            onChange={(step) => update({ step })}
            step={1}
          />
          <NumberConfigField
            id={`${blockId}-start`}
            label="Start"
            value={config.start}
            onChange={(start) => update({ start })}
            step={1}
          />
          <NumberConfigField
            id={`${blockId}-end`}
            label="End"
            value={config.end}
            onChange={(end) => update({ end })}
            step={1}
          />
          <div className="md:col-span-2">
            <JsonConfigField
              id={`${blockId}-body-block-ids`}
              label="Body block ids"
              value={config.bodyBlockIds}
              fallbackValue={[]}
              onChange={(bodyBlockIds) => update({ bodyBlockIds })}
              description="Temporary model field until visual loop containers are added."
            />
          </div>
        </div>
      );

    case "loop.forEach":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <StringConfigField
            id={`${blockId}-item-name`}
            label="Item variable"
            value={config.itemName}
            onChange={(itemName) => update({ itemName })}
            placeholder="item"
          />
          <StringConfigField
            id={`${blockId}-index-name`}
            label="Index variable"
            value={config.indexName}
            onChange={(indexName) => update({ indexName })}
            placeholder="index"
          />
          <div className="md:col-span-2">
            <JsonConfigField
              id={`${blockId}-body-block-ids`}
              label="Body block ids"
              value={config.bodyBlockIds}
              fallbackValue={[]}
              onChange={(bodyBlockIds) => update({ bodyBlockIds })}
              description="Temporary model field until visual loop containers are added."
            />
          </div>
        </div>
      );

    case "loop.while":
      return (
        <div className="space-y-4">
          <TextConfigField
            id={`${blockId}-condition`}
            label="Condition"
            value={config.condition}
            onChange={(condition) => update({ condition })}
            placeholder="hasMoreItems === true"
          />
          <NumberConfigField
            id={`${blockId}-max-iterations`}
            label="Max iterations"
            value={config.maxIterations}
            onChange={(maxIterations) => update({ maxIterations })}
            min={1}
            max={10000}
            step={1}
            description="Guardrail to avoid infinite loops when execution is added."
          />
          <JsonConfigField
            id={`${blockId}-body-block-ids`}
            label="Body block ids"
            value={config.bodyBlockIds}
            fallbackValue={[]}
            onChange={(bodyBlockIds) => update({ bodyBlockIds })}
          />
        </div>
      );

    default:
      return null;
  }
}
