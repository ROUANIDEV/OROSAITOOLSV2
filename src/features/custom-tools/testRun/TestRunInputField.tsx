import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { CustomToolInput } from "../model/customToolTypes";
import type { TestInputValues } from "./testRunTypes";

type TestRunInputFieldProps = {
  input: CustomToolInput;
  value: TestInputValues[string];
  onValueChange: (value: TestInputValues[string]) => void;
};

export function TestRunInputField({
  input,
  value,
  onValueChange,
}: TestRunInputFieldProps) {
  if (input.type === "textarea") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={`test-${input.id}`}>{input.label}</Label>
        <Textarea
          id={`test-${input.id}`}
          value={String(value ?? "")}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>
    );
  }

  if (input.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onValueChange(event.target.checked)}
        />
        {input.label}
      </label>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={`test-${input.id}`}>{input.label}</Label>
      <Input
        id={`test-${input.id}`}
        type={input.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        placeholder={
          input.type === "file" || input.type === "folder"
            ? "Paste a path for dry-run testing"
            : undefined
        }
        onChange={(event) =>
          onValueChange(
            input.type === "number"
              ? Number(event.target.value)
              : event.target.value,
          )
        }
      />
    </div>
  );
}