import type { CustomToolInput } from "../../../../domain/customToolTypes";

type CustomToolInputRowProps = {
  input: CustomToolInput;
};

export function CustomToolInputRow({ input }: CustomToolInputRowProps) {
  return (
    <div className="rounded-xl border p-3 text-sm text-muted-foreground">
      Legacy input row for {input.id}. Inputs are now IO blocks on the canvas.
    </div>
  );
}
