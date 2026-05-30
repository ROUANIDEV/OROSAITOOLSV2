import type { ChangeEvent, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CustomToolBlock } from "../../../../domain/customToolTypes";
import type { FoundationDataType } from "../../../foundation";
import type { FoundationArrowInputSuggestion } from "../../../../runtime/foundationWorkflowRuntime";

export type FoundationReferenceOption = {
  id: string;
  label: string;
  dataType?: FoundationDataType | "unknown" | string;
  sourceBlockId?: string;
  sourcePortId?: string;
  connected?: boolean;
};

export type FoundationConfigEditorProps = {
  blockId: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  referenceOptions?: FoundationReferenceOption[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
};

export const dataTypeOptions = [
  "string",
  "number",
  "boolean",
  "json",
  "array",
  "list",
  "dictionary",
  "object",
  "file",
  "folder",
  "void",
  "unknown",
];

export const scopeOptions = ["local", "global"];

export function updateFoundationConfig(
  config: Record<string, unknown>,
  onConfigChange: (config: Record<string, unknown>) => void,
  patch: Record<string, unknown>,
) {
  onConfigChange({ ...config, ...patch });
}

function configString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function configNumberOrString(value: unknown, fallback = "") {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return fallback;
}

function parseNumberOrReference(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const numberValue = Number(trimmed);
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && Number.isFinite(numberValue)) {
    return numberValue;
  }
  return trimmed;
}

function normalizeReferenceOptions(
  options?: FoundationReferenceOption[],
  suggestions?: FoundationArrowInputSuggestion[],
) {
  const byId = new Map<string, FoundationReferenceOption>();

  for (const option of options ?? []) {
    if (!option.id) continue;
    byId.set(option.id, option);
  }

  for (const suggestion of suggestions ?? []) {
    const id = suggestion.sourceName || suggestion.token.replace(/^{{|}}$/g, "");
    if (!id) continue;
    byId.set(id, {
      id,
      label: `${suggestion.sourceLabel} → ${suggestion.targetFieldLabel}`,
      dataType: "unknown",
      sourceBlockId: suggestion.sourceBlockId,
      connected: true,
    });
  }

  return [...byId.values()].sort((left, right) => {
    if (left.connected !== right.connected) return left.connected ? -1 : 1;
    return left.id.localeCompare(right.id);
  });
}

function optionAcceptsType(
  option: FoundationReferenceOption,
  acceptedTypes?: readonly string[],
) {
  if (!acceptedTypes || acceptedTypes.length === 0) return true;
  if (!option.dataType || option.dataType === "unknown") return true;
  return acceptedTypes.includes(String(option.dataType));
}

export function getCanvasReferenceOptions(blocks: CustomToolBlock[] = []) {
  const options: FoundationReferenceOption[] = [];

  for (const block of blocks) {
    const config = block.config ?? {};
    const blockType = String(block.type);

    if (blockType === "io.input") {
      const inputId = configString(config.inputId);
      if (inputId) {
        options.push({
          id: inputId,
          label: `${block.label || inputId} · input`,
          dataType: configString(config.dataType, "unknown"),
          sourceBlockId: block.id,
          sourcePortId: "value",
        });
      }
    }

    if (blockType === "variable.create" || blockType === "variable.assign") {
      const name = configString(config.name);
      if (name) {
        options.push({
          id: name,
          label: `${name} · variable`,
          dataType: configString(config.dataType, "unknown"),
          sourceBlockId: block.id,
          sourcePortId: "value",
        });
      }
    }

    if (blockType === "constant.create") {
      const name = configString(config.name);
      if (name) {
        options.push({
          id: name,
          label: `${name} · constant`,
          dataType: configString(config.dataType, "unknown"),
          sourceBlockId: block.id,
          sourcePortId: "value",
        });
      }
    }

    if (blockType === "function.call") {
      const assignTo = configString(config.assignTo);
      if (assignTo) {
        options.push({
          id: assignTo,
          label: `${assignTo} · function result`,
          dataType: "unknown",
          sourceBlockId: block.id,
          sourcePortId: "result",
        });
      }
    }

    if (blockType === "math.operation" || blockType === "logic.compare") {
      const resultName = configString(config.resultName);
      if (resultName) {
        options.push({
          id: resultName,
          label: `${block.label || resultName} · ${blockType === "math.operation" ? "math result" : "comparison result"}`,
          dataType: blockType === "math.operation" ? "number" : "boolean",
          sourceBlockId: block.id,
          sourcePortId: "result",
        });
      }
    }

    if (blockType === "loop.for") {
      const indexName = configString(config.indexName, "i");
      if (indexName) {
        options.push({
          id: indexName,
          label: `${block.label || indexName} · loop index`,
          dataType: "number",
          sourceBlockId: block.id,
          sourcePortId: "index",
        });
      }
    }
  }

  const unique = new Map(options.map((option) => [option.id, option]));
  return [...unique.values()];
}

function FieldShell({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function StringConfigField({
  label,
  value,
  onChange,
  placeholder,
  description,
  readOnly,
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  readOnly?: boolean;
}) {
  return (
    <FieldShell label={label} description={description}>
      <Input
        value={configString(value)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </FieldShell>
  );
}

export function TextConfigField({
  label,
  value,
  onChange,
  placeholder,
  description,
  minHeightClassName = "min-h-24",
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  minHeightClassName?: string;
}) {
  return (
    <FieldShell label={label} description={description}>
      <Textarea
        value={configString(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={minHeightClassName}
      />
    </FieldShell>
  );
}

export function BooleanConfigField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: unknown;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch checked={Boolean(value)} onCheckedChange={onChange} />
    </div>
  );
}

export function NumberConfigField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
}: {
  label: string;
  value: unknown;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}) {
  return (
    <FieldShell label={label} description={description}>
      <Input
        type="number"
        value={typeof value === "number" ? value : Number(value ?? 0)}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </FieldShell>
  );
}

export function SelectConfigField({
  label,
  value,
  options,
  onChange,
  description,
}: {
  label: string;
  value: unknown;
  options: readonly string[];
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <FieldShell label={label} description={description}>
      <Select value={configString(value)} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function ReferenceSelectField({
  label,
  value,
  onChange,
  acceptedTypes,
  description,
  referenceOptions,
  linkedInputSuggestions,
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  acceptedTypes?: readonly string[];
  description?: string;
  referenceOptions?: FoundationReferenceOption[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
}) {
  const options = normalizeReferenceOptions(referenceOptions, linkedInputSuggestions).filter(
    (option) => optionAcceptsType(option, acceptedTypes),
  );
  const currentValue = configString(value);
  const connectedValue = options.find((option) => option.connected)?.id ?? "";
  const displayValue = currentValue || connectedValue;

  return (
    <FieldShell label={label} description={description}>
      <Select value={displayValue || "__manual__"} onValueChange={(next) => onChange(next === "__manual__" ? "" : next)}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a canvas value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__manual__">Manual value</SelectItem>
          {options.map((option) => (
            <SelectItem key={`${option.id}-${option.sourceBlockId ?? "canvas"}`} value={option.id}>
              {option.connected ? "🔗 " : ""}{option.id} — {option.label}
              {option.dataType ? ` (${option.dataType})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function ExpressionConfigField({
  label,
  value,
  onChange,
  placeholder,
  description,
  acceptedTypes,
  referenceOptions,
  linkedInputSuggestions,
}: {
  label: string;
  value: unknown;
  onChange: (value: string | number) => void;
  placeholder?: string;
  description?: string;
  acceptedTypes?: readonly string[];
  referenceOptions?: FoundationReferenceOption[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
}) {
  const currentValue = configNumberOrString(value);
  const autoConnectedValue = normalizeReferenceOptions(referenceOptions, linkedInputSuggestions)
    .filter((option) => optionAcceptsType(option, acceptedTypes))
    .find((option) => option.connected)?.id ?? "";
  const displayValue = currentValue || autoConnectedValue;

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <StringConfigField
        label={label}
        value={displayValue}
        onChange={(next) => onChange(parseNumberOrReference(next))}
        placeholder={placeholder}
        description={description}
      />
      <ReferenceSelectField
        label="Choose value from canvas"
        value={configNumberOrString(value)}
        onChange={(next) => onChange(next)}
        acceptedTypes={acceptedTypes}
        referenceOptions={referenceOptions}
        linkedInputSuggestions={linkedInputSuggestions}
        description="Choose an input, variable, constant, or function result from the canvas."
      />
    </div>
  );
}

export function ArrayReferenceConfigField({
  label,
  value,
  onChange,
  description,
  acceptedTypes,
  referenceOptions,
  linkedInputSuggestions,
}: {
  label: string;
  value: unknown;
  onChange: (value: string[]) => void;
  description?: string;
  acceptedTypes?: readonly string[];
  referenceOptions?: FoundationReferenceOption[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
}) {
  const values = Array.isArray(value)
    ? value.map((item) => String(item))
    : typeof value === "string" && value.trim()
      ? [value.trim()]
      : [];
  const options = normalizeReferenceOptions(referenceOptions, linkedInputSuggestions).filter(
    (option) => optionAcceptsType(option, acceptedTypes),
  );

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <FieldShell label={label} description={description}>
        <Textarea
          value={values.join("\n")}
          onChange={(event) =>
            onChange(
              event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            )
          }
          className="min-h-24 font-mono text-xs"
          placeholder={'n\notherValue'}
        />
      </FieldShell>
      <ReferenceSelectField
        label="Add value from canvas"
        value=""
        acceptedTypes={acceptedTypes}
        referenceOptions={options}
        linkedInputSuggestions={linkedInputSuggestions}
        onChange={(next) => {
          if (!next) return;
          onChange([...values.filter((item) => item !== next), next]);
        }}
      />
    </div>
  );
}

export function JsonConfigField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  description?: string;
}) {
  const text = JSON.stringify(value ?? null, null, 2);
  return (
    <FieldShell label={label} description={description}>
      <Textarea
        value={text}
        onChange={(event) => {
          try {
            onChange(JSON.parse(event.target.value));
          } catch {
            onChange(event.target.value);
          }
        }}
        className="min-h-28 font-mono text-xs"
      />
    </FieldShell>
  );
}
