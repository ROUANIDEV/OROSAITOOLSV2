import { useState } from "react";
import { CheckSquare, File, FolderOpen, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { selectCustomToolPath } from "../files/picker/selectCustomToolPath";
import type { CustomToolInput } from "../../domain/customToolTypes";
import type { TestInputValues } from "../state/testRunTypes";

type TestRunInputFieldProps = {
  input: CustomToolInput;
  value: TestInputValues[string];
  onValueChange: (value: string | number | boolean) => void;
};

function stringifyValue(value: TestInputValues[string]) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function fieldHelp(input: CustomToolInput) {
  if (input.description) return input.description;
  if (input.type === "file") return "Choose or paste a file path.";
  if (input.type === "folder") return "Choose or paste a folder path.";
  if (input.type === "number") return "Enter a number for this run.";
  if (input.type === "boolean") return "Turn this on or off for this run.";
  return "Enter a value for this run.";
}

export function TestRunInputField({
  input,
  value,
  onValueChange,
}: TestRunInputFieldProps) {
  const [pickerError, setPickerError] = useState("");
  const stringValue = stringifyValue(value);

  const choosePath = async () => {
    if (input.type !== "file" && input.type !== "folder") return;

    setPickerError("");
    try {
      const selectedPath = await selectCustomToolPath({
        mode: input.type,
        title:
          input.type === "folder"
            ? `Select folder for ${input.label}`
            : `Select file for ${input.label}`,
      });
      if (selectedPath) onValueChange(selectedPath);
    } catch (error) {
      setPickerError(
        error instanceof Error ? error.message : "Unable to open the picker.",
      );
    }
  };

  if (input.type === "boolean") {
    const checked = value === true || stringValue === "true";
    return (
      <div className="space-y-2 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{input.label}</p>
            <p className="text-xs text-muted-foreground">{fieldHelp(input)}</p>
          </div>
          <Button
            type="button"
            variant={checked ? "default" : "outline"}
            onClick={() => onValueChange(!checked)}
          >
            {checked ? (
              <CheckSquare className="mr-2 h-4 w-4" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            {checked ? "True" : "False"}
          </Button>
        </div>
      </div>
    );
  }

  if (input.type === "number") {
    return (
      <label className="block space-y-2 rounded-2xl border bg-card p-4 text-sm">
        <span className="font-medium">{input.label}</span>
        <Input
          type="number"
          value={stringValue}
          onChange={(event) => onValueChange(Number(event.target.value))}
          placeholder="5"
        />
        <span className="block text-xs text-muted-foreground">{fieldHelp(input)}</span>
      </label>
    );
  }

  if (input.type === "textarea") {
    return (
      <label className="block space-y-2 rounded-2xl border bg-card p-4 text-sm">
        <span className="font-medium">{input.label}</span>
        <Textarea
          value={stringValue}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={fieldHelp(input)}
          className="min-h-28"
        />
      </label>
    );
  }

  if (input.type === "file" || input.type === "folder") {
    const isFolder = input.type === "folder";
    return (
      <div className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
        <label className="block space-y-2">
          <span className="font-medium">{input.label}</span>
          <div className="flex gap-2">
            <Input
              value={stringValue}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder={fieldHelp(input)}
            />
            <Button type="button" variant="outline" onClick={choosePath}>
              {isFolder ? (
                <FolderOpen className="mr-2 h-4 w-4" />
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              Browse
            </Button>
          </div>
        </label>
        {pickerError ? (
          <p className="text-xs text-destructive">{pickerError}</p>
        ) : null}
      </div>
    );
  }

  return (
    <label className="block space-y-2 rounded-2xl border bg-card p-4 text-sm">
      <span className="font-medium">{input.label}</span>
      <Input
        value={stringValue}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={fieldHelp(input)}
      />
    </label>
  );
}
