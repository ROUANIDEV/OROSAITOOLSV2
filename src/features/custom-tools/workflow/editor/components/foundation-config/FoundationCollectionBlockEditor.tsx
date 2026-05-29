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

const sortModeOptions = [
  { value: "number", label: "Number sort" },
  { value: "text", label: "Text sort" },
  { value: "auto", label: "Auto" },
] as const;

const sortDirectionOptions = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

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
          <StringConfigField
            id={`${blockId}-output-name`}
            label="Output name"
            value={config.outputName}
            onChange={(outputName) => update({ outputName })}
            placeholder="numbers"
            description="This name becomes available to linked target blocks as {{numbers}}."
          />
          <SelectConfigField
            id={`${blockId}-item-type`}
            label="Item type"
            value={config.itemType}
            options={dataTypeOptions}
            onChange={(itemType) => update({ itemType })}
          />
          <JsonConfigField
            id={`${blockId}-items`}
            label="Items"
            value={config.items}
            fallbackValue={[]}
            onChange={(items) => update({ items })}
            description="Example for sorting: [5, 1, 4, 2, 3]"
          />
        </div>
      );

    case "collection.list":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-output-name`}
            label="Output name"
            value={config.outputName}
            onChange={(outputName) => update({ outputName })}
            placeholder="items"
            description="This name becomes available to linked target blocks as {{items}}."
          />
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
            description="Mutable lists can be appended, sorted, or updated by later model blocks."
          />
        </div>
      );

    case "collection.dictionary":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-output-name`}
            label="Output name"
            value={config.outputName}
            onChange={(outputName) => update({ outputName })}
            placeholder="dictionary"
            description="This name becomes available to linked target blocks as {{dictionary}}."
          />
          <SelectConfigField
            id={`${blockId}-key-type`}
            label="Key type"
            value={config.keyType}
            options={dataTypeOptions}
            onChange={(keyType) => update({ keyType })}
          />
          <SelectConfigField
            id={`${blockId}-value-type`}
            label="Value type"
            value={config.valueType}
            options={dataTypeOptions}
            onChange={(valueType) => update({ valueType })}
          />
          <JsonConfigField
            id={`${blockId}-entries`}
            label="Entries"
            value={config.entries}
            fallbackValue={[]}
            onChange={(entries) => update({ entries })}
            description='Example: [{ "key": "name", "value": "OrosAI" }]'
          />
        </div>
      );

    case "collection.get":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-collection`}
            label="Collection input"
            value={config.collection}
            onChange={(collection) => update({ collection })}
            placeholder="{{numbers}}"
            description="Use a linked output token or a collection variable name."
          />
          <StringConfigField
            id={`${blockId}-key`}
            label="Key or index"
            value={config.key}
            onChange={(key) => update({ key })}
            placeholder="0 or user.name"
          />
          <JsonConfigField
            id={`${blockId}-fallback`}
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
            id={`${blockId}-collection`}
            label="Collection input"
            value={config.collection}
            onChange={(collection) => update({ collection })}
            placeholder="{{numbers}}"
            description="Use a linked output token or a collection variable name."
          />
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
            id={`${blockId}-immutable`}
            label="Immutable update"
            checked={config.immutableUpdate}
            onChange={(immutableUpdate) => update({ immutableUpdate })}
            description="Create a new collection instead of mutating the original collection."
          />
        </div>
      );

    case "collection.sort":
      return (
        <div className="space-y-4">
          <StringConfigField
            id={`${blockId}-output-name`}
            label="Output name"
            value={config.outputName}
            onChange={(outputName) => update({ outputName })}
            placeholder="sortedNumbers"
            description="This name can be consumed by later blocks as {{sortedNumbers}}."
          />
          <StringConfigField
            id={`${blockId}-collection`}
            label="Array/List input"
            value={config.collection}
            onChange={(collection) => update({ collection })}
            placeholder="{{numbers}}"
            description="Connect an array/list block with an arrow, then click Use this output in this block details to fill this field."
          />
          <SelectConfigField
            id={`${blockId}-sort-mode`}
            label="Sort mode"
            value={config.mode}
            options={sortModeOptions}
            onChange={(mode) => update({ mode })}
            description="Use number sort for arrays like [5, 1, 4, 2, 3]."
          />
          <SelectConfigField
            id={`${blockId}-direction`}
            label="Direction"
            value={config.direction}
            options={sortDirectionOptions}
            onChange={(direction) => update({ direction })}
          />
          <BooleanConfigField
            id={`${blockId}-stable`}
            label="Stable sort"
            checked={config.stable}
            onChange={(stable) => update({ stable })}
            description="Keeps equal values in their original relative order."
          />
        </div>
      );

    default:
      return null;
  }
}
