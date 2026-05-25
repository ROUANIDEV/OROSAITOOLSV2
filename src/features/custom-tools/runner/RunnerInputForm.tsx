import type { CustomToolManifest } from "@/features/custom-tools/model/customToolTypes";
import type { TestInputValues } from "@/features/custom-tools/testRun/testRunTypes";
import { TestRunInputField } from "@/features/custom-tools/testRun/TestRunInputField";

type RunnerInputFormProps = {
  tool: CustomToolManifest;
  values: TestInputValues;
  onValueChange: (
    inputId: string,
    value: string | number | boolean,
  ) => void;
};

export function RunnerInputForm({
  tool,
  values,
  onValueChange,
}: RunnerInputFormProps) {
  if (tool.inputs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        This tool does not define any inputs.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tool.inputs.map((input) => (
        <TestRunInputField
          key={input.id}
          input={input}
          value={values[input.id] ?? ""}
          onValueChange={(value) => onValueChange(input.id, value)}
        />
      ))}
    </div>
  );
}