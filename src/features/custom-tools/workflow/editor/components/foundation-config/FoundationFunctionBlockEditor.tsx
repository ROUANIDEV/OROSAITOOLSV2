import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  ArrayReferenceConfigField,
  BooleanConfigField,
  dataTypeOptions,
  ExpressionConfigField,
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
  blockType,
  config,
  onConfigChange,
  referenceOptions,
  linkedInputSuggestions,
}: FoundationFunctionBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  switch (blockType) {
    case "scope.global":
      return (
        <div className="space-y-4">
          <StringConfigField label="Namespace" value={config.namespace} onChange={(namespace) => update({ namespace })} placeholder="global" />
          <TextConfigField label="Description" value={config.description} onChange={(description) => update({ description })} placeholder="Shared settings used by the whole tool." />
        </div>
      );

    case "scope.local":
      return (
        <div className="space-y-4">
          <StringConfigField label="Namespace" value={config.namespace} onChange={(namespace) => update({ namespace })} placeholder="local" />
          <BooleanConfigField label="Inherit parent" value={config.inheritParent} onChange={(inheritParent) => update({ inheritParent })} description="Allow this scope to read variables declared by a parent scope." />
        </div>
      );

    case "function.define":
      return (
        <div className="space-y-4">
          <StringConfigField label="Function name" value={config.name} onChange={(name) => update({ name })} placeholder="factorial" />
          <SelectConfigField label="Return type" value={config.returnType} options={dataTypeOptions} onChange={(returnType) => update({ returnType })} />
          <JsonConfigField label="Parameters" value={config.parameters} onChange={(parameters) => update({ parameters })} description='Use simple names like ["n"] or objects like [{ "name": "n", "type": "number" }].' />
          <ExpressionConfigField label="Return expression" value={config.returnExpression} onChange={(returnExpression) => update({ returnExpression })} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} placeholder="result" />
        </div>
      );

    case "function.call":
      return (
        <div className="space-y-4">
          <StringConfigField label="Function name" value={config.functionName} onChange={(functionName) => update({ functionName })} placeholder="factorial" />
          <ArrayReferenceConfigField label="Arguments" value={config.arguments} onChange={(argumentValues) => update({ arguments: argumentValues })} referenceOptions={referenceOptions} linkedInputSuggestions={linkedInputSuggestions} description="Add generated canvas input ids or other runtime references in call order." />
          <StringConfigField label="Assign result to" value={config.assignTo} onChange={(assignTo) => update({ assignTo })} placeholder="factorialResult" description="This creates a variable/reference that later blocks can choose." />
          <BooleanConfigField label="Await result" value={config.awaitResult} onChange={(awaitResult) => update({ awaitResult })} description="When enabled, later blocks wait for the function result." />
        </div>
      );

    default:
      return null;
  }
}
