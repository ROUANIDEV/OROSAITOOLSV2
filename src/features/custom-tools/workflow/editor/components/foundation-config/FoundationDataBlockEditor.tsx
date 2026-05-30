import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  BooleanConfigField,
  dataTypeOptions,
  ExpressionConfigField,
  JsonConfigField,
  scopeOptions,
  SelectConfigField,
  StringConfigField,
  TextConfigField,
  type FoundationConfigEditorProps,
  updateFoundationConfig,
} from "./FoundationConfigFields";

type FoundationDataBlockEditorProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

export function FoundationDataBlockEditor({
  blockType,
  config,
  onConfigChange,
  referenceOptions,
  linkedInputSuggestions,
}: FoundationDataBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "variable.create":
      return (
        <div className="space-y-4">
          <StringConfigField
            label="Variable name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="result"
          />
          <SelectConfigField
            label="Scope"
            value={config.scope}
            options={scopeOptions}
            onChange={(scope) => update({ scope })}
          />
          <SelectConfigField
            label="Data type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <BooleanConfigField
            label="Mutable"
            value={config.mutable}
            onChange={(mutable) => update({ mutable })}
            description="Turn this off only when the value should be read-only."
          />
          <ExpressionConfigField
            label="Initial value"
            value={config.initialValue}
            onChange={(initialValue) => update({ initialValue })}
            acceptedTypes={
              typeof config.dataType === "string" ? [config.dataType] : undefined
            }
            referenceOptions={referenceOptions}
            linkedInputSuggestions={linkedInputSuggestions}
            placeholder="1"
            description="Use a literal value or connect another block into the Initial value port."
          />
        </div>
      );

    case "variable.assign":
      return (
        <div className="space-y-4">
          <StringConfigField
            label="Variable name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="result"
          />
          <ExpressionConfigField
            label="New value"
            value={config.value ?? config.expression}
            onChange={(value) => update({ value, expression: undefined })}
            referenceOptions={referenceOptions}
            linkedInputSuggestions={linkedInputSuggestions}
            placeholder="Connect Math operation → Result here"
            description="For block-only tools, connect a Math/Compare/Input output into the New value port instead of typing code."
          />
        </div>
      );

    case "variable.update":
      return (
        <div className="space-y-4">
          <StringConfigField
            label="Variable name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="result"
          />
          <SelectConfigField
            label="Data type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <ExpressionConfigField
            label="Start value"
            value={config.initialValue}
            onChange={(initialValue) => update({ initialValue })}
            acceptedTypes={
              typeof config.dataType === "string" ? [config.dataType] : undefined
            }
            referenceOptions={referenceOptions}
            linkedInputSuggestions={linkedInputSuggestions}
            placeholder="1"
            description="The first value used before the loop starts. Use 1 for multiplication/factorial, 0 for sums."
          />
          <SelectConfigField
            label="Operation"
            value={config.operation ?? config.operator}
            options={["add", "subtract", "multiply", "divide", "modulo", "power"]}
            onChange={(operation) => update({ operation, operator: undefined })}
          />
          <ExpressionConfigField
            label="Value to use"
            value={config.operand ?? config.value}
            onChange={(operand) => update({ operand, value: undefined })}
            acceptedTypes={["number"]}
            referenceOptions={referenceOptions}
            linkedInputSuggestions={linkedInputSuggestions}
            placeholder="Connect loop index here"
            description="Connect the number that updates the stored value. For factorial, connect For loop → Index."
          />
        </div>
      );

    case "constant.create":
      return (
        <div className="space-y-4">
          <StringConfigField
            label="Constant name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="MAX_ITEMS"
          />
          <SelectConfigField
            label="Data type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <JsonConfigField
            label="Value"
            value={config.value}
            onChange={(value) => update({ value })}
            description={'Use JSON syntax, for example: "text", 15, true, [], or {}.'}
          />
        </div>
      );

    case "expression.value":
      return (
        <div className="space-y-4">
          <SelectConfigField
            label="Data type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <ExpressionConfigField
            label="Value"
            value={config.expression}
            onChange={(expression) => update({ expression })}
            acceptedTypes={
              typeof config.dataType === "string" ? [config.dataType] : undefined
            }
            referenceOptions={referenceOptions}
            linkedInputSuggestions={linkedInputSuggestions}
            placeholder="Connect or choose a value"
          />
        </div>
      );

    case "expression.template":
      return (
        <div className="space-y-4">
          <TextConfigField
            label="Template"
            value={config.template}
            onChange={(template) => update({ template })}
            placeholder="Hello {{name}}"
            minHeightClassName="min-h-32"
          />
          <SelectConfigField
            label="Missing value strategy"
            value={config.missingValueStrategy}
            options={["empty", "keep-token", "error"]}
            onChange={(missingValueStrategy) => update({ missingValueStrategy })}
          />
        </div>
      );

    default:
      return null;
  }
}
