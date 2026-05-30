import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  BooleanConfigField,
  ExpressionConfigField,
  JsonConfigField,
  NumberConfigField,
  StringConfigField,
  type FoundationConfigEditorProps,
  updateFoundationConfig,
} from "./FoundationConfigFields";

type FoundationControlFlowBlockEditorProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

export function FoundationControlFlowBlockEditor({
  blockType,
  config,
  onConfigChange,
  referenceOptions,
  linkedInputSuggestions,
}: FoundationControlFlowBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "control.if":
      return (
        <div className="space-y-4">
          <ExpressionConfigField label="Condition" value={config.condition} onChange={(condition) => update({ condition })} acceptedTypes={["boolean"]} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} placeholder="n > 1" />
          <BooleanConfigField label="False branch enabled" value={config.falseBranchEnabled} onChange={(falseBranchEnabled) => update({ falseBranchEnabled })} />
        </div>
      );

    case "control.switch":
      return (
        <div className="space-y-4">
          <ExpressionConfigField label="Value expression" value={config.expression} onChange={(expression) => update({ expression })} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} placeholder="action" />
          <JsonConfigField label="Cases" value={config.cases} onChange={(cases) => update({ cases })} description='Example: [{ "when": "format", "label": "Format files" }]' />
          <BooleanConfigField label="Default case enabled" value={config.defaultCaseEnabled} onChange={(defaultCaseEnabled) => update({ defaultCaseEnabled })} />
        </div>
      );

    case "loop.for":
      return (
        <div className="space-y-4">
          <StringConfigField label="Index variable" value={config.indexName} onChange={(indexName) => update({ indexName })} placeholder="i" />
          <ExpressionConfigField label="Start" value={config.start} onChange={(start) => update({ start })} acceptedTypes={["number"]} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} placeholder="2" />
          <ExpressionConfigField label="End" value={config.end} onChange={(end) => update({ end })} acceptedTypes={["number"]} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} placeholder="Choose input id or type n" description="This accepts a generated canvas input id, a number, or an expression. It is intentionally not a number-only UI anymore." />
          <ExpressionConfigField label="Step" value={config.step} onChange={(step) => update({ step })} acceptedTypes={["number"]} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} placeholder="1" />
          <BooleanConfigField label="Inclusive end" value={config.inclusiveEnd} onChange={(inclusiveEnd) => update({ inclusiveEnd })} description="Enable for factorial loops from 2 through n." />
        </div>
      );

    case "loop.forEach":
      return (
        <div className="space-y-4">
          <StringConfigField label="Item variable" value={config.itemName} onChange={(itemName) => update({ itemName })} placeholder="item" />
          <StringConfigField label="Index variable" value={config.indexName} onChange={(indexName) => update({ indexName })} placeholder="index" />
          <ExpressionConfigField label="Items" value={config.items} onChange={(items) => update({ items })} acceptedTypes={["array", "list"]} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} />
        </div>
      );

    case "loop.while":
      return (
        <div className="space-y-4">
          <ExpressionConfigField label="Condition" value={config.condition} onChange={(condition) => update({ condition })} acceptedTypes={["boolean"]} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} />
          <NumberConfigField label="Max iterations" value={config.maxIterations} min={1} max={10000} step={1} onChange={(maxIterations) => update({ maxIterations })} description="Guardrail to avoid infinite loops." />
        </div>
      );

    default:
      return null;
  }
}
