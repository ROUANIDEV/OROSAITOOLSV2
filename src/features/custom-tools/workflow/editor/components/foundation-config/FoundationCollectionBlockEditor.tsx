import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  BooleanConfigField,
  dataTypeOptions,
  JsonConfigField,
  SelectConfigField,
  StringConfigField,
  type FoundationConfigEditorProps,
  updateFoundationConfig,
} from "./FoundationConfigFields";

type FoundationCollectionBlockEditorProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

export function FoundationCollectionBlockEditor({
  blockId,
  blockType,
  config,
  onConfigChange,
}: FoundationCollectionBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "collection.array":
      return (
        <div className="space-y-4">
          <SelectConfigField
            id={`${blockId}-item-type`}
            label="Item type"
            value={config.itemType}
            options={dataTypeOptions}
            onChange={(itemType) => update({ itemType })}
          />
          <JsonConfigField
            id={`${blockId}-items`}
            label="Array items"
            value={config.items}
            fallbackValue={[]}
            onChange={(items) => update({ items })}
            description='Example: ["README.md", "package.json"]'
          />
        </div>
      );

    case "collection.list":
      return (
        <div className="space-y-4">
          <SelectConfigField
            id={`${blockId}-item-type`}
            label="Item type"
            value={config.itemType}
            options={dataTypeOptions}
            onChange={(itemType) => update({ itemType })}
          />
          <JsonConfigField
            id={`${blockId}-items`}
            label="Initial items"
            value={config.items}
            fallbackValue={[]}
            onChange={(items) => update({ items })}
          />
          <BooleanConfigField
            id={`${blockId}-mutable`}
            label="Mutable list"
            checked={config.mutable}
            onChange={(mutable) => update({ mutable })}
            description="Mutable lists can be appended or updated by later model blocks."
          />
        </div>
      );

    case "collection.dictionary":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectConfigField
            id={`${blockId}-key-type`}
            label="Key type"
            value={config.keyType}
            options={[{ value: "string", label: "string" }]}
            onChange={(keyType) => update({ keyType })}
          />
          <SelectConfigField
            id={`${blockId}-value-type`}
            label="Value type"
            value={config.valueType}
            options={dataTypeOptions}
            onChange={(valueType) => update({ valueType })}
          />
          <div className="md:col-span-2">
            <JsonConfigField
              id={`${blockId}-entries`}
              label="Entries"
              value={config.entries}
              fallbackValue={[]}
              onChange={(entries) => update({ entries })}
              description='Example: [{ "key": "name", "value": "OrosAI" }]'
            />
          </div>
        </div>
      );

    case "collection.get":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-key`}
            label="Key or index"
            value={config.key}
            onChange={(key) => update({ key })}
            placeholder="0 or user.name"
          />
          <JsonConfigField
            id={`${blockId}-fallback-value`}
            label="Fallback value"
            value={config.fallbackValue}
            fallbackValue={null}
            onChange={(fallbackValue) => update({ fallbackValue })}
            description="Returned when the key/index does not exist."
          />
        </div>
      );

    case "collection.set":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-key`}
            label="Key or index"
            value={config.key}
            onChange={(key) => update({ key })}
            placeholder="status"
          />
          <JsonConfigField
            id={`${blockId}-value`}
            label="Value"
            value={config.value}
            fallbackValue={null}
            onChange={(value) => update({ value })}
          />
          <BooleanConfigField
            id={`${blockId}-immutable-update`}
            label="Immutable update"
            checked={config.immutableUpdate}
            onChange={(immutableUpdate) => update({ immutableUpdate })}
            description="Create a new collection instead of mutating the original collection."
          />
        </div>
      );

    default:
      return null;
  }
}
