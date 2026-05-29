import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  BooleanConfigField,
  dataTypeOptions,
  JsonConfigField,
  SelectConfigField,
  StringConfigField,
  TextConfigField,
  type FoundationConfigEditorProps,
  updateFoundationConfig,
} from "./FoundationConfigFields";

type FoundationFunctionBlockEditorProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

export function FoundationFunctionBlockEditor({
  blockId,
  blockType,
  config,
  onConfigChange,
}: FoundationFunctionBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "scope.global":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-namespace`}
            label="Global namespace"
            value={config.namespace}
            onChange={(namespace) => update({ namespace })}
            placeholder="global"
          />
          <TextConfigField
            id={`${blockId}-description`}
            label="Scope description"
            value={config.description}
            onChange={(description) => update({ description })}
            placeholder="Shared settings used by the whole tool."
          />
        </div>
      );

    case "scope.local":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-namespace`}
            label="Local namespace"
            value={config.namespace}
            onChange={(namespace) => update({ namespace })}
            placeholder="local"
          />
          <BooleanConfigField
            id={`${blockId}-inherit-parent`}
            label="Inherit parent scope"
            checked={config.inheritParent}
            onChange={(inheritParent) => update({ inheritParent })}
            description="Allow this scope to read variables declared by a parent scope."
          />
        </div>
      );

    case "function.define":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <StringConfigField
            id={`${blockId}-name`}
            label="Function name"
            value={config.name}
            onChange={(name) => update({ name })}
            placeholder="buildReport"
          />
          <SelectConfigField
            id={`${blockId}-return-type`}
            label="Return type"
            value={config.returnType}
            options={dataTypeOptions}
            onChange={(returnType) => update({ returnType })}
          />
          <div className="md:col-span-2">
            <JsonConfigField
              id={`${blockId}-parameters`}
              label="Parameters"
              value={config.parameters}
              fallbackValue={[]}
              onChange={(parameters) => update({ parameters })}
              description='Example: [{ "name": "path", "type": "string", "required": true }]'
            />
          </div>
          <div className="md:col-span-2">
            <JsonConfigField
              id={`${blockId}-body-block-ids`}
              label="Body block ids"
              value={config.bodyBlockIds}
              fallbackValue={[]}
              onChange={(bodyBlockIds) => update({ bodyBlockIds })}
              description="Temporary model field until nested visual regions are added."
            />
          </div>
        </div>
      );

    case "function.call":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-function-name`}
            label="Function name"
            value={config.functionName}
            onChange={(functionName) => update({ functionName })}
            placeholder="buildReport"
          />
          <JsonConfigField
            id={`${blockId}-arguments`}
            label="Arguments"
            value={config.arguments}
            fallbackValue={[]}
            onChange={(argumentValues) => update({ arguments: argumentValues })}
            description='Example: [{ "name": "path", "value": "inputs.path" }]'
          />
          <BooleanConfigField
            id={`${blockId}-await-result`}
            label="Await result"
            checked={config.awaitResult}
            onChange={(awaitResult) => update({ awaitResult })}
            description="When enabled, later blocks should wait for this function result."
          />
        </div>
      );

    default:
      return null;
  }
}
