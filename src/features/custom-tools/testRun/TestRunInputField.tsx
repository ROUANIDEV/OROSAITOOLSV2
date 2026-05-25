import { useState } from "react";
import { File, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { selectCustomToolPath } from "../inputPicker/selectCustomToolPath";
import type { CustomToolInput } from "../model/customToolTypes";
import type { TestInputValues } from "./testRunTypes";

type TestRunInputFieldProps = {
  input: CustomToolInput;
  value: TestInputValues[string];
  onValueChange: (value: string | number | boolean) => void;
};

function stringifyValue(value: TestInputValues[string]) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export function TestRunInputField({
  input,
  value,
  onValueChange,
}: TestRunInputFieldProps) {
  const [pickerError, setPickerError] = useState("");
  const stringValue = stringifyValue(value);

  const choosePath = async () => {
    if (input.type !== "file" && input.type !== "folder") {
      return;
    }

    setPickerError("");

    try {
      const selectedPath = await selectCustomToolPath({
        mode: input.type,
        title:
          input.type === "folder"
            ? `Select folder for ${input.label}`
            : `Select file for ${input.label}`,
      });

      if (selectedPath) {
        onValueChange(selectedPath);
      }
    } catch (error) {
      setPickerError(
        error instanceof Error
          ? error.message
          : "Unable to open the native picker.",
      );
    }
  };

  if (input.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onValueChange(event.target.checked)}
        />
        <span>{input.label}</span>
      </label>
    );
  }

  if (input.type === "number") {
    return (
      <label className="block space-y-2 text-sm">
        <span className="font-medium">{input.label}</span>
        <Input
          type="number"
          value={stringValue}
          onChange={(event) => onValueChange(Number(event.target.value))}
          placeholder={input.description}
        />
      </label>
    );
  }

  if (input.type === "textarea") {
    return (
      <label className="block space-y-2 text-sm">
        <span className="font-medium">{input.label}</span>
        <Textarea
          value={stringValue}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={input.description}
        />
      </label>
    );
  }

  if (input.type === "file" || input.type === "folder") {
    const isFolder = input.type === "folder";

    return (
      <div className="space-y-2 text-sm">
        <label className="block space-y-2">
          <span className="font-medium">{input.label}</span>
          <div className="flex gap-2">
            <Input
              value={stringValue}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder={input.description}
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
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{input.label}</span>
      <Input
        value={stringValue}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={input.description}
      />
    </label>
  );
}