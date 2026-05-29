import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  BooleanConfigField,
  dataTypeOptions,
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
  blockId,
  blockType,
  config,
  onConfigChange,
}: FoundationDataBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "variable.create":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <StringConfigField
            id={`${blockId}-name`}
            label="Variable name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="customerName"
          />
          <SelectConfigField
            id={`${blockId}-scope`}
            label="Scope"
            value={config.scope}
            options={scopeOptions}
            onChange={(scope) => update({ scope })}
          />
          <SelectConfigField
            id={`${blockId}-data-type`}
            label="Data type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <BooleanConfigField
            id={`${blockId}-mutable`}
            label="Mutable variable"
            checked={config.mutable}
            onChange={(mutable) => update({ mutable })}
            description="Disable this when the value should behave like a read-only variable."
          />
          <div className="md:col-span-2">
            <TextConfigField
              id={`${blockId}-initial-value`}
              label="Initial value / expression"
              value={config.initialValue}
              onChange={(initialValue) => update({ initialValue })}
              placeholder={'inputs.sourceFolder or "hello"'}
              description="Keep this as a simple expression for now. Later we will validate it with the model compiler."
            />
          </div>
        </div>
      );

    case "variable.assign":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <StringConfigField
            id={`${blockId}-name`}
            label="Variable name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="value"
          />
          <TextConfigField
            id={`${blockId}-expression`}
            label="New value expression"
            value={config.expression}
            onChange={(expression) => update({ expression })}
            placeholder="item.path"
          />
        </div>
      );

    case "constant.create":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <StringConfigField
            id={`${blockId}-name`}
            label="Constant name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="API_TIMEOUT_MS"
          />
          <SelectConfigField
            id={`${blockId}-data-type`}
            label="Data type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <div className="md:col-span-2">
            <JsonConfigField
              id={`${blockId}-value`}
              label="Constant value"
              value={config.value}
              fallbackValue=""
              onChange={(value) => update({ value })}
              description={'Use JSON syntax, for example: "text", 15, true, [], or {}.'}
            />
          </div>
        </div>
      );

    case "expression.value":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectConfigField
            id={`${blockId}-data-type`}
            label="Result type"
            value={config.dataType}
            options={dataTypeOptions}
            onChange={(dataType) => update({ dataType })}
          />
          <div className="md:col-span-2">
            <TextConfigField
              id={`${blockId}-expression`}
              label="Expression"
              value={config.expression}
              onChange={(expression) => update({ expression })}
              placeholder="inputs.name.toUpperCase()"
              minHeightClassName="min-h-32"
            />
          </div>
        </div>
      );

    case "expression.template":
      return (
        <div className="space-y-4">
          <TextConfigField
            id={`${blockId}-template`}
            label="Template"
            value={config.template}
            onChange={(template) => update({ template })}
            placeholder="Hello {{inputs.name}}"
            description="Use {{variableName}} placeholders. Runtime binding will be added later."
            minHeightClassName="min-h-32"
          />
          <SelectConfigField
            id={`${blockId}-missing-value-strategy`}
            label="Missing value strategy"
            value={config.missingValueStrategy}
            options={[
              { value: "empty-string", label: "Empty string" },
              { value: "keep-placeholder", label: "Keep placeholder" },
              { value: "throw-error", label: "Throw error" },
            ]}
            onChange={(missingValueStrategy) =>
              update({ missingValueStrategy })
            }
          />
        </div>
      );

    default:
      return null;
  }
}
