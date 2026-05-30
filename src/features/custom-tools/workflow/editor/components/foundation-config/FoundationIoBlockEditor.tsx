import { Button } from "@/components/ui/button";
import {
  BooleanConfigField,
  dataTypeOptions,
  ExpressionConfigField,
  SelectConfigField,
  TextConfigField,
  type FoundationConfigEditorProps,
  updateFoundationConfig,
} from "./FoundationConfigFields";
import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";

type FoundationIoBlockEditorProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

function configString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function CopyableGeneratedId({
  label,
  value,
  help,
}: {
  label: string;
  value: unknown;
  help: string;
}) {
  const id = configString(value, "not-generated-yet");

  const copyId = () => {
    if (!navigator.clipboard || id === "not-generated-yet") return;
    void navigator.clipboard.writeText(id);
  };

  return (
    <div className="space-y-2 rounded-xl border bg-background/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <code className="mt-1 block select-all rounded-md bg-muted px-2 py-1 text-sm">
            {id}
          </code>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copyId}>
          Copy id
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  );
}

export function FoundationIoBlockEditor({
  blockType,
  config,
  onConfigChange,
  referenceOptions,
  linkedInputSuggestions,
}: FoundationIoBlockEditorProps) {
  const update = (patch: Record<string, unknown>) => {
    updateFoundationConfig(config, onConfigChange, patch);
  };

  if (blockType === "io.input") {
    return (
      <div className="space-y-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
        <CopyableGeneratedId
          label="Generated input id"
          value={config.inputId}
          help="Read-only. Use arrows first; copy this id only when a block field must be filled manually. The block name at the top is the user-facing input name."
        />
        <SelectConfigField
          label="Input type"
          value={config.dataType}
          options={dataTypeOptions.filter((type) => type !== "void" && type !== "unknown")}
          onChange={(dataType) => update({ dataType })}
          description="Run Rust Workflow shows the correct value field for this type. File and folder inputs show Browse controls."
        />
        <BooleanConfigField
          label="Required"
          value={config.required}
          onChange={(required) => update({ required })}
        />
        <TextConfigField
          label="Help text"
          value={config.description}
          onChange={(description) => update({ description })}
          placeholder="Explain what the user should enter."
          minHeightClassName="min-h-20"
        />
      </div>
    );
  }

  if (blockType === "io.output") {
    return (
      <div className="space-y-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
        <CopyableGeneratedId
          label="Generated output id"
          value={config.outputId}
          help="Read-only. This is the result field shown after Run Rust Workflow. The block name at the top is the user-facing output name."
        />
        <SelectConfigField
          label="Output type"
          value={config.dataType}
          options={dataTypeOptions.filter((type) => type !== "void")}
          onChange={(dataType) => update({ dataType })}
        />
        <ExpressionConfigField
          label="Output value"
          value={config.value}
          onChange={(value) => update({ value, expression: undefined })}
          acceptedTypes={typeof config.dataType === "string" ? [config.dataType] : undefined}
          referenceOptions={referenceOptions}
          linkedInputSuggestions={linkedInputSuggestions}
          placeholder="result"
          description="Connect a value arrow into this port or choose a canvas value."
        />
        <TextConfigField
          label="Help text"
          value={config.description}
          onChange={(description) => update({ description })}
          placeholder="Explain this result to the user."
          minHeightClassName="min-h-20"
        />
      </div>
    );
  }

  return null;
}
