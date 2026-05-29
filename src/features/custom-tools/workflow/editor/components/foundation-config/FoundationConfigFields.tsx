import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { foundationDataTypes } from "../../../foundation";

export type FoundationConfigEditorProps = {
  blockId: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
};

export type SelectOption = {
  value: string;
  label: string;
};

export function updateFoundationConfig(
  config: Record<string, unknown>,
  onConfigChange: (config: Record<string, unknown>) => void,
  patch: Record<string, unknown>,
) {
  onConfigChange({
    ...config,
    ...patch,
  });
}

export function getStringConfigValue(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string" ? value : fallback;
}

export function getNumberConfigValue(
  value: unknown,
  fallback = 0,
): number {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getBooleanConfigValue(
  value: unknown,
  fallback = false,
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function StringConfigField({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={getStringConfigValue(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function TextConfigField({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
  minHeightClassName = "min-h-24",
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  minHeightClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={getStringConfigValue(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={minHeightClassName}
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function NumberConfigField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
}: {
  id: string;
  label: string;
  value: unknown;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={getNumberConfigValue(value)}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function BooleanConfigField({
  id,
  label,
  checked,
  onChange,
  description,
}: {
  id: string;
  label: string;
  checked: unknown;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background/60 p-3"
    >
      <input
        id={id}
        type="checkbox"
        checked={getBooleanConfigValue(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-input accent-primary"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function SelectConfigField({
  id,
  label,
  value,
  options,
  onChange,
  description,
}: {
  id: string;
  label: string;
  value: unknown;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={getStringConfigValue(value, options[0]?.value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function formatJson(value: unknown, fallback: unknown) {
  return JSON.stringify(value ?? fallback, null, 2);
}

export function JsonConfigField({
  id,
  label,
  value,
  fallbackValue,
  onChange,
  description,
  minHeightClassName = "min-h-28",
}: {
  id: string;
  label: string;
  value: unknown;
  fallbackValue: unknown;
  onChange: (value: unknown) => void;
  description?: string;
  minHeightClassName?: string;
}) {
  const [text, setText] = useState(() => formatJson(value, fallbackValue));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(formatJson(value, fallbackValue));
    setError(null);
  }, [fallbackValue, value]);

  const commitJson = () => {
    try {
      onChange(JSON.parse(text));
      setError(null);
    } catch {
      setError("Invalid JSON. Keep this field as valid JSON before saving.");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commitJson}
        spellCheck={false}
        className={`${minHeightClassName} font-mono text-xs`}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export const dataTypeOptions = foundationDataTypes.map((type) => ({
  value: type,
  label: type,
}));

export const scopeOptions = [
  { value: "local", label: "Local" },
  { value: "global", label: "Global" },
  { value: "function", label: "Function" },
  { value: "block", label: "Block" },
];
